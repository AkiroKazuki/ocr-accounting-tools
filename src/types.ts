export interface ExtractedDataRow {
     [key: string]: string | number; // Or more specific types if known
}

export interface GroundingChunkWeb {
     uri: string;
     title: string;
}

export interface GroundingChunk {
     web: GroundingChunkWeb;
}

export interface GroundingMetadata {
     groundingChunks?: GroundingChunk[];
}
