export interface StoryStyle {
    id: string;
    label: string;
}

export interface AspectRatio {
    label: string;
    value: string;
}

export interface StoryGenre {
    id: string;
    label: string;
}

export interface WritingStyle {
    id: string;
    label: string;
}

export const STORY_STYLES: StoryStyle[] = [
    { id: 'pixar', label: 'Pixar' },
    { id: 'realistic', label: 'Realistic' },
    { id: 'disney', label: 'Disney' },
    { id: 'ghibli', label: 'Ghibli' },
    { id: 'anime', label: 'Anime' },
    { id: 'cyberpunk', label: 'Cyberpunk' },
    { id: 'fantasy', label: 'Fantasy Art' },
];

export const ASPECT_RATIOS: AspectRatio[] = [
    { label: 'مربع (1:1)', value: '1:1' },
    { label: 'عمودي (9:16)', value: '9:16' },
    { label: 'أفقي (16:9)', value: '16:9' },
    { label: 'سينمائي (21:9)', value: '21:9' },
];

export const STORY_GENRES: StoryGenre[] = [
    { id: 'drama', label: 'دراما' },
    { id: 'fantasy', label: 'خيالي' },
    { id: 'sci-fi', label: 'خيال علمي' },
    { id: 'romance', label: 'رومانسي' },
    { id: 'crime', label: 'جريمة' },
    { id: 'horror', label: 'رعب' },
    { id: 'comedy', label: 'كوميدي' },
    { id: 'adventure', label: 'مغامرة' },
];

export const WRITING_STYLES: WritingStyle[] = [
    { id: 'cartoonish', label: 'كرتوني' },
    { id: 'realistic', label: 'واقعي' },
    { id: 'cinematic', label: 'سينمائي' },
    { id: 'poetic', label: 'شاعري' },
    { id: 'journalistic', label: 'صحفي' },
];
