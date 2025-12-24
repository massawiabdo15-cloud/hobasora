
// Fix: Use `import type` for type-only imports to make types available within this module.
import type { StoryStyle, AspectRatio, StoryGenre, WritingStyle } from './constants';

export interface Character {
    name: string;
    description: string;
    image: string | null;
    isLoading: boolean;
}

export interface Scene {
    sceneNumber: number;
    prompt: string;
    image: string | null;
    videoUri: string | null; // Added for video support
    isLoading: boolean;
    isVideoLoading: boolean; // Added to track video generation state
    aspectRatio: AspectRatio;
}

export interface StoryAnalysis {
    characters: {
        name: string;
        description: string;
    }[];
    scenes: {
        sceneNumber: number;
        prompt: string;
    }[];
}

export interface ProjectData {
    storyText: string;
    notes?: string;
    numScenes: number;
    storyStyle: StoryStyle;
    aspectRatio: AspectRatio;
    characters: Character[];
    scenes: Scene[];
}

// Fix: Re-export StoryStyle and AspectRatio types so other modules can import them from types.ts, fixing module resolution errors.
export type { StoryStyle, AspectRatio, StoryGenre, WritingStyle };
