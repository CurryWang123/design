export type BrandStage = 
  | 'market-analysis' 
  | 'brand-story' 
  | 'formula-design'
  | 'visual-identity' 
  | 'packaging-design' 
  | 'marketing-video';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BrandProject {
  name: string;
  targetAudience: string;
  salesChannels: string;
  salesRegions: string;
  painPoints: string;
  coreValues: string;
  
  // History tracking
  history: {
    [key in BrandStage]?: any[];
  };
  currentVersion: {
    [key in BrandStage]?: number;
  };

  marketAnalysis?: ChatMessage[];
  brandStory?: ChatMessage[];
  formulaDesign?: ChatMessage[];
  visualIdentity?: ChatMessage[];
  visualIdentityImage?: string;
  packagingDesign?: ChatMessage[];
  packagingImage?: string;
  packagingReferenceImage?: string;
  productionSpecs?: string;
  productionDielineImage?: string;
  marketingVideoUrl?: string;
  marketingVideoReferenceImage?: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
