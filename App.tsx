
import React, { useState, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { StoryStyle, AspectRatio, Character, Scene, StoryAnalysis, ProjectData } from './types';
import { STORY_STYLES, ASPECT_RATIOS } from './constants';
import { fileToBase64, parsePdf } from './utils/fileUtils';
import { InputSection } from './components/InputSection';
import { CharacterSection } from './components/CharacterSection';
import { SceneSection } from './components/SceneSection';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { Header } from './components/Header';
import { StoryGeneratorSection } from './components/StoryGeneratorSection';

// Ensure process is recognized globally in the browser environment
declare const process: {
  env: {
    API_KEY: string;
  };
};

// Fix: Extend window for AI Studio helpers.
// We define the structure inline and remove 'readonly' to ensure compatibility 
// with the pre-configured global execution context and avoid modifier/type mismatch errors.
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'generator' | 'visualizer'>('generator');
    const [storyText, setStoryText] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [numScenes, setNumScenes] = useState<number>(3);
    const [storyStyle, setStoryStyle] = useState<StoryStyle>(STORY_STYLES[0]);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleStoryGenerated = (newStory: string) => {
        setStoryText(newStory);
        setActiveTab('visualizer');
        setCharacters([]);
        setScenes([]);
        setError(null);
    };
    
    const handlePdfUpload = async (file: File) => {
        setIsLoading(true);
        setLoadingMessage('جاري قراءة ملف PDF...');
        setError(null);
        try {
            const text = await parsePdf(file);
            setStoryText(text);
        } catch (e) {
            setError('فشل في قراءة ملف PDF. الرجاء المحاولة مرة أخرى.');
            console.error(e);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    const analyzeStory = useCallback(async () => {
        if (!storyText.trim()) {
            setError('الرجاء إدخال قصة أو رفع ملف PDF.');
            return;
        }
        setIsLoading(true);
        setLoadingMessage('جاري تحليل القصة واستخراج الشخصيات والمشاهد...');
        setError(null);
        setCharacters([]);
        setScenes([]);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `
        اقرأ القصة التالية بعناية. مهمتك هي:
        1. تحديد الشخصيات الرئيسية وتقديم وصف بصري مفصل لكل شخصية مناسب لتوليد صورة.
        2. تقسيم القصة إلى ${numScenes} مشاهد رئيسية.
        3. لكل مشهد، قم بكتابة برومت (prompt) مفصل ومبدع لتوليد صورة فنية. يجب أن يتضمن البرومت وصفًا للمكان، الحدث، الشخصيات الموجودة، زاوية كاميرا سينمائية، ونوع الإضاءة. يجب أن ينتهي كل برومت بعبارة " بأسلوب ${storyStyle.label}".
        
        ${notes ? `
        ملحوظات إضافية هامة:
        ${notes}
        ` : ''}

        القصة:
        ---
        ${storyText}
        ---
        `;

        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            characters: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING }
                                    },
                                    required: ['name', 'description']
                                }
                            },
                            scenes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        sceneNumber: { type: Type.INTEGER },
                                        prompt: { type: Type.STRING }
                                    },
                                    required: ['sceneNumber', 'prompt']
                                }
                            }
                        },
                        required: ['characters', 'scenes']
                    },
                }
            });
            
            const result: StoryAnalysis = JSON.parse(response.text || '{}');
            
            const initialCharacters = result.characters.map(c => ({ ...c, image: null, isLoading: true }));
            setCharacters(initialCharacters);

            const initialScenes = result.scenes.map(s => ({ 
                ...s, 
                image: null, 
                videoUri: null,
                isLoading: false, 
                isVideoLoading: false,
                aspectRatio: aspectRatio 
            }));
            setScenes(initialScenes);

            generateAllCharacterImages(initialCharacters);

        } catch (e) {
            console.error(e);
            setError('حدث خطأ أثناء تحليل القصة. حاول مرة أخرى.');
            setIsLoading(false);
        }
    }, [storyText, numScenes, storyStyle, aspectRatio, notes]);

    const generateAllCharacterImages = async (initialCharacters: Character[]) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        setLoadingMessage('جاري إنشاء صور الشخصيات...');
        const characterPromises = initialCharacters.map(async (char) => {
            const prompt = `صورة شخصية لـ ${char.name}, ${char.description}, بأسلوب ${storyStyle.label}. أنشئ الصورة بنسبة عرض إلى ارتفاع ${aspectRatio.value}.`;
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: prompt }] },
                });
                const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
                if (part && part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
                throw new Error("No image data returned.");
            } catch (e) {
                console.error(`Failed to generate image for ${char.name}:`, e);
                return 'error';
            }
        });

        const images = await Promise.all(characterPromises);
        
        setCharacters(prev => prev.map((char, index) => ({
            ...char,
            image: images[index] === 'error' ? null : images[index],
            isLoading: false
        })));
        
        setIsLoading(false);
        setLoadingMessage('');
    };

    const regenerateCharacterImage = useCallback(async (characterIndex: number) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const character = characters[characterIndex];
        if (!character) return;

        setCharacters(prev => prev.map((char, index) => 
            index === characterIndex ? { ...char, isLoading: true } : char
        ));
        setError(null);

        const prompt = `صورة شخصية لـ ${character.name}, ${character.description}, بأسلوب ${storyStyle.label}. أنشئ الصورة بنسبة عرض إلى ارتفاع ${aspectRatio.value}.`;
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
            });
            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (part && part.inlineData) {
                const newImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setCharacters(prev => prev.map((char, index) => 
                    index === characterIndex ? { ...char, image: newImage, isLoading: false } : char
                ));
            } else {
                throw new Error("No image data returned.");
            }
        } catch (e) {
            console.error(`Failed to regenerate image for ${character.name}:`, e);
             setCharacters(prev => prev.map((char, index) => 
                index === characterIndex ? { ...char, isLoading: false, image: null } : char
            ));
             setError(`فشل في إعادة إنشاء صورة لـ ${character.name}.`);
        }
    }, [characters, storyStyle, aspectRatio]);

    const handleUploadCharacterImage = async (characterIndex: number, file: File) => {
        setCharacters(prev => prev.map((char, index) => 
            index === characterIndex ? { ...char, isLoading: true } : char
        ));
        try {
            const base64Image = await fileToBase64(file);
            setCharacters(prev => prev.map((char, index) => 
                index === characterIndex ? { ...char, image: base64Image, isLoading: false } : char
            ));
        } catch (e) {
            console.error("Failed to upload and convert image:", e);
            setError(`فشل في رفع الصورة لـ ${characters[characterIndex].name}.`);
            setCharacters(prev => prev.map((char, index) =>
                index === characterIndex ? { ...char, isLoading: false } : char
            ));
        }
    };
    
    const handleCharacterDescriptionChange = (characterIndex: number, newDescription: string) => {
        setCharacters(prev => prev.map((char, index) =>
            index === characterIndex ? { ...char, description: newDescription } : char
        ));
    };

    const handleScenePromptChange = (sceneIndex: number, newPrompt: string) => {
        setScenes(prev => prev.map((scene, index) =>
            index === sceneIndex ? { ...scene, prompt: newPrompt } : scene
        ));
    };

    const handleSceneAspectRatioChange = (sceneIndex: number, newRatio: AspectRatio) => {
        setScenes(prevScenes => prevScenes.map((scene, index) => {
            if (index === sceneIndex) {
                return { ...scene, aspectRatio: newRatio };
            }
            return scene;
        }));
    };

    const generateSceneImage = useCallback(async (sceneIndex: number) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const scene = scenes[sceneIndex];
        if (!scene) return;
        
        setScenes(prev => prev.map((s, i) => i === sceneIndex ? { ...s, isLoading: true } : s));
        setError(null);

        const validCharacterImages = characters
            .filter(c => c.image !== null)
            .map(c => {
                const img = c.image!;
                return {
                    inlineData: {
                        data: img.split(',')[1],
                        mimeType: img.split(';')[0].split(':')[1],
                    },
                };
            });

        const promptWithAspectRatio = `تعليمات هامة: يجب إنشاء الصورة النهائية بنسبة عرض إلى ارتفاع صارمة تبلغ ${scene.aspectRatio.value}. محتوى الصورة هو: ${scene.prompt}`;

        const parts = [
            ...validCharacterImages,
            { text: promptWithAspectRatio }
        ];

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
            });
            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

            if (part && part.inlineData) {
                const newImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setScenes(prev => prev.map((s, i) => i === sceneIndex ? { ...s, image: newImage, isLoading: false } : s));
            } else {
                throw new Error("لم يتم إرجاع بيانات الصورة.");
            }
        } catch (e) {
            console.error(`Failed to generate image for scene ${scene.sceneNumber}:`, e);
            setError(`فشل في إنشاء صورة للمشهد ${scene.sceneNumber}.`);
            setScenes(prev => prev.map((s, i) => i === sceneIndex ? { ...s, isLoading: false } : s));
        }
    }, [scenes, characters]);

    const generateSceneVideo = useCallback(async (sceneIndex: number) => {
        const scene = scenes[sceneIndex];
        if (!scene || !scene.image) {
            setError('يجب إنشاء صورة للمشهد أولاً قبل تحريكها.');
            return;
        }

        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        setScenes(prev => prev.map((s, i) => i === sceneIndex ? { ...s, isVideoLoading: true } : s));
        setError(null);

        try {
            const base64Data = scene.image.split(',')[1];
            const mimeType = scene.image.split(';')[0].split(':')[1];

            const animationPrompt = `Animate the characters in this scene with natural, fluid movements. Make them blink, move their heads, or perform subtle actions matching the scene context: ${scene.prompt}. Keep the background consistent.`;

            let targetAspectRatio: '16:9' | '9:16' = '16:9';
            if (scene.aspectRatio.value === '9:16') {
                targetAspectRatio = '9:16';
            }

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: animationPrompt,
                image: {
                    imageBytes: base64Data,
                    mimeType: mimeType,
                },
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: targetAspectRatio
                }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const videoUri = `${downloadLink}&key=${process.env.API_KEY}`;
                setScenes(prev => prev.map((s, i) => i === sceneIndex ? { ...s, videoUri, isVideoLoading: false } : s));
            } else {
                throw new Error("فشل في الحصول على رابط الفيديو.");
            }
        } catch (e: any) {
            console.error(`Failed to generate video for scene ${scene.sceneNumber}:`, e);
            if (e.message?.includes("Requested entity was not found")) {
                setError("حدث خطأ في مفتاح API. يرجى اختيار مفتاح صالح.");
                await window.aistudio.openSelectKey();
            } else {
                setError(`فشل في تحريك الشخصيات في المشهد ${scene.sceneNumber}.`);
            }
            setScenes(prev => prev.map((s, i) => i === sceneIndex ? { ...s, isVideoLoading: false } : s));
        }
    }, [scenes]);

    const handleDeleteSceneImage = (sceneIndex: number) => {
        setScenes(prev => prev.map((scene, index) =>
            index === sceneIndex ? { ...scene, image: null, videoUri: null } : scene
        ));
    };

    const handleImportProject = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') return;
                const data: ProjectData = JSON.parse(result);
                if (data.storyText && data.numScenes) {
                    setStoryText(data.storyText);
                    setNotes(data.notes || '');
                    setNumScenes(data.numScenes);
                    setStoryStyle(data.storyStyle);
                    setAspectRatio(data.aspectRatio);
                    setCharacters(data.characters);
                    setScenes(data.scenes.map(s => ({ ...s, isVideoLoading: false })));
                    setError(null);
                }
            } catch (e) {
                setError('فشل في استيراد المشروع.');
            }
        };
        reader.readAsText(file);
    };

    const TabButton: React.FC<{
        label: string;
        isActive: boolean;
        onClick: () => void;
    }> = ({ label, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`px-6 py-3 text-lg font-bold transition-colors duration-300 focus:outline-none ${
                isActive
                    ? 'border-b-2 border-brand-pink text-white'
                    : 'text-text-secondary hover:text-white'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-base-100 text-text-main p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Header />

                <div className="flex justify-center border-b border-white/10 mb-8">
                    <TabButton
                        label="حوّل فكرتك لقصة"
                        isActive={activeTab === 'generator'}
                        onClick={() => setActiveTab('generator')}
                    />
                    <TabButton
                        label="حوّل قصتك لمشاهد"
                        isActive={activeTab === 'visualizer'}
                        onClick={() => setActiveTab('visualizer')}
                    />
                </div>

                <main className="space-y-12">
                     {activeTab === 'generator' && (
                        <StoryGeneratorSection onStoryGenerated={handleStoryGenerated} />
                    )}

                    {activeTab === 'visualizer' && (
                        <>
                            <InputSection
                                storyText={storyText}
                                setStoryText={setStoryText}
                                notes={notes}
                                setNotes={setNotes}
                                numScenes={numScenes}
                                setNumScenes={setNumScenes}
                                storyStyle={storyStyle}
                                setStoryStyle={setStoryStyle}
                                aspectRatio={aspectRatio}
                                setAspectRatio={setAspectRatio}
                                onAnalyze={analyzeStory}
                                onPdfUpload={handlePdfUpload}
                                onProjectImport={handleImportProject}
                                isLoading={isLoading}
                            />

                            {isLoading && <LoadingSpinner message={loadingMessage} />}
                            {error && <ErrorMessage message={error} />}

                            <div className="animate-fade-in space-y-12">
                                {characters.length > 0 && (
                                    <CharacterSection 
                                        characters={characters}
                                        onRegenerateImage={regenerateCharacterImage}
                                        onUploadImage={handleUploadCharacterImage}
                                        onDescriptionChange={handleCharacterDescriptionChange}
                                        aspectRatio={aspectRatio}
                                    />
                                )}

                                {scenes.length > 0 && (
                                    <SceneSection
                                        scenes={scenes}
                                        onGenerateImage={generateSceneImage}
                                        onGenerateVideo={generateSceneVideo}
                                        onAspectRatioChange={handleSceneAspectRatioChange}
                                        onPromptChange={handleScenePromptChange}
                                        onDeleteImage={handleDeleteSceneImage}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
