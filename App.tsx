
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
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

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

        const prompt = `
        اقرأ القصة التالية بعناية. مهمتك هي:
        1. تحديد الشخصيات الرئيسية وتقديم وصف بصري مفصل لكل شخصية مناسب لتوليد صورة.
        2. تقسيم القصة إلى ${numScenes} مشاهد رئيسية.
        3. لكل مشهد، قم بكتابة برومت (prompt) مفصل ومبدع لتوليد صورة فنية. يجب أن يتضمن البرومت وصفًا للمكان، الحدث، الشخصيات الموجودة، زاوية كاميرا سينمائية (مثل: wide shot, close-up, low-angle shot)، ونوع الإضاءة (مثل: dramatic lighting, soft morning light, neon glow). يجب أن ينتهي كل برومت بعبارة " بأسلوب ${storyStyle.label}".
        
        ${notes ? `
        ملحوظات إضافية هامة يجب مراعاتها عند تحليل القصة ووصف المشاهد والشخصيات:
        ${notes}
        ` : ''}

        القصة:
        ---
        ${storyText}
        ---
        `;

        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-2.5-pro",
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
                                        name: { type: Type.STRING, description: 'اسم الشخصية' },
                                        description: { type: Type.STRING, description: 'وصف بصري للشخصية' }
                                    },
                                    required: ['name', 'description']
                                }
                            },
                            scenes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        sceneNumber: { type: Type.INTEGER, description: 'رقم المشهد' },
                                        prompt: { type: Type.STRING, description: 'البرومت المفصل للمشهد' }
                                    },
                                    required: ['sceneNumber', 'prompt']
                                }
                            }
                        },
                        required: ['characters', 'scenes']
                    },
                }
            });
            
            const result: StoryAnalysis = JSON.parse(response.text);
            
            const initialCharacters = result.characters.map(c => ({ ...c, image: null, isLoading: true }));
            setCharacters(initialCharacters);

            const initialScenes = result.scenes.map(s => ({ ...s, image: null, isLoading: false, aspectRatio: aspectRatio }));
            setScenes(initialScenes);

            generateAllCharacterImages(initialCharacters);

        } catch (e) {
            console.error(e);
            setError('حدث خطأ أثناء تحليل القصة. حاول مرة أخرى.');
            setIsLoading(false);
        }
    }, [storyText, numScenes, storyStyle, ai.models, aspectRatio, notes]);

    const generateAllCharacterImages = async (initialCharacters: Character[]) => {
        setLoadingMessage('جاري إنشاء صور الشخصيات...');
        const characterPromises = initialCharacters.map(async (char) => {
            const prompt = `صورة شخصية لـ ${char.name}, ${char.description}, بأسلوب ${storyStyle.label}. أنشئ الصورة بنسبة عرض إلى ارتفاع ${aspectRatio.value}.`;
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: prompt }] },
                    config: { responseModalities: [Modality.IMAGE] },
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
                config: { responseModalities: [Modality.IMAGE] },
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
    }, [characters, storyStyle, ai.models, aspectRatio]);

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
        const scene = scenes[sceneIndex];
        if (!scene) return;
        
        setScenes(prev => prev.map((s, i) => i === sceneIndex ? { ...s, isLoading: true } : s));
        setError(null);

        const validCharacterImages = characters
            .filter(c => c.image)
            .map(c => ({
                inlineData: {
                    data: c.image!.split(',')[1],
                    mimeType: c.image!.split(';')[0].split(':')[1],
                },
            }));

        const promptWithAspectRatio = `تعليمات هامة: يجب إنشاء الصورة النهائية بنسبة عرض إلى ارتفاع صارمة تبلغ ${scene.aspectRatio.value}. محتوى الصورة هو: ${scene.prompt}`;

        const parts = [
            ...validCharacterImages,
            { text: promptWithAspectRatio }
        ];

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: { responseModalities: [Modality.IMAGE] },
            });
            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);

            if (part && part.inlineData) {
                const newImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setScenes(prev => prev.map((s, i) => i === sceneIndex ? { ...s, image: newImage, isLoading: false } : s));
            } else {
                throw new Error("لم يتم إرجاع بيانات الصورة من الواجهة البرمجية.");
            }
        } catch (e) {
            console.error(`Failed to generate image for scene ${scene.sceneNumber}:`, e);
            setError(`فشل في إنشاء صورة للمشهد ${scene.sceneNumber}. حاول مرة أخرى.`);
            setScenes(prev => prev.map((s, i) => i === sceneIndex ? { ...s, isLoading: false } : s));
        }
    }, [scenes, characters, ai.models]);

    const handleDeleteSceneImage = (sceneIndex: number) => {
        setScenes(prev => prev.map((scene, index) =>
            index === sceneIndex ? { ...scene, image: null } : scene
        ));
    };

    const handleExportProject = () => {
        const projectData: ProjectData = {
            storyText,
            notes,
            numScenes,
            storyStyle,
            aspectRatio,
            characters,
            scenes,
        };
        const jsonString = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'story-visualizer-project.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportProject = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') {
                    throw new Error('فشل في قراءة الملف.');
                }
                const data: ProjectData = JSON.parse(result);
                // Basic validation
                if (data.storyText && data.numScenes && data.storyStyle && data.characters && data.scenes && data.aspectRatio) {
                    setStoryText(data.storyText);
                    setNotes(data.notes || '');
                    setNumScenes(data.numScenes);
                    setStoryStyle(data.storyStyle);
                    setAspectRatio(data.aspectRatio);
                    setCharacters(data.characters);
                    
                    const migratedScenes = data.scenes.map(scene => ({
                        ...scene,
                        // If aspectRatio is missing in an old project file, set it from the global one
                        aspectRatio: scene.aspectRatio || data.aspectRatio || ASPECT_RATIOS[0]
                    }));
                    setScenes(migratedScenes);
                    setError(null);
                } else {
                    throw new Error('ملف المشروع غير صالح أو تالف.');
                }
            } catch (e) {
                console.error(e);
                setError((e as Error).message || 'فشل في استيراد المشروع. تأكد من أن الملف صحيح.');
            }
        };
        reader.onerror = () => {
            setError('حدث خطأ أثناء قراءة الملف.');
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

                            {characters.length > 0 && !isLoading && (
                                <div className="text-center animate-fade-in">
                                    <button
                                        onClick={handleExportProject}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                        تصدير المشروع
                                    </button>
                                </div>
                            )}

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
