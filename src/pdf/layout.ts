import type { SourceLocation } from '../errors/index.js';

export interface PdfPageSettings {
	readonly width: number;
	readonly height: number;
	readonly marginTop: number;
	readonly marginRight: number;
	readonly marginBottom: number;
	readonly marginLeft: number;
}

export interface PdfLayoutDocument {
	readonly page: PdfPageSettings;
	readonly flow: readonly PdfLayoutBlock[];
}

export type PdfLayoutBlock =
	| PdfLayoutParagraph
	| PdfLayoutHeading
	| PdfLayoutCodeBlock
	| PdfLayoutQuoteBlock
	| PdfLayoutListBlock
	| PdfLayoutImageBlock
	| PdfLayoutTableBlock
	| PdfLayoutRuleBlock;

interface PdfLayoutNodeBase {
	readonly kind: string;
	readonly source?: SourceLocation;
	readonly marginTop?: number;
	readonly marginBottom?: number;
}

export interface PdfLayoutHeading extends PdfLayoutNodeBase {
	readonly kind: 'heading';
	readonly level: 1 | 2 | 3 | 4 | 5 | 6;
	readonly lines: readonly PdfTextLine[];
}

export interface PdfLayoutParagraph extends PdfLayoutNodeBase {
	readonly kind: 'paragraph';
	readonly lines: readonly PdfTextLine[];
}

export interface PdfLayoutCodeBlock extends PdfLayoutNodeBase {
	readonly kind: 'code-block';
	readonly lines: readonly PdfTextLine[];
	readonly language?: string;
}

export interface PdfLayoutQuoteBlock extends PdfLayoutNodeBase {
	readonly kind: 'quote-block';
	readonly children: readonly PdfLayoutBlock[];
}

export interface PdfLayoutListBlock extends PdfLayoutNodeBase {
	readonly kind: 'list-block';
	readonly ordered: boolean;
	readonly items: readonly PdfLayoutListItem[];
}

export interface PdfLayoutListItem {
	readonly marker: string;
	readonly children: readonly PdfLayoutBlock[];
	readonly source?: SourceLocation;
}

export interface PdfLayoutImageBlock extends PdfLayoutNodeBase {
	readonly kind: 'image-block';
	readonly uri: string;
	readonly altText?: string;
	readonly fit: PdfImageFitMode;
	readonly maxWidth?: number;
	readonly maxHeight?: number;
}

export type PdfImageFitMode = 'contain' | 'cover' | 'none';

export interface PdfLayoutTableBlock extends PdfLayoutNodeBase {
	readonly kind: 'table-block';
	readonly columns: readonly PdfTableColumnSpec[];
	readonly rows: readonly PdfTableRowLayout[];
}

export interface PdfTableColumnSpec {
	readonly align: 'left' | 'center' | 'right';
	readonly minWidth?: number;
	readonly preferredWidth?: number;
}

export interface PdfTableRowLayout {
	readonly cells: readonly PdfTableCellLayout[];
	readonly header: boolean;
	readonly source?: SourceLocation;
}

export interface PdfTableCellLayout {
	readonly blocks: readonly PdfLayoutBlock[];
	readonly colspan?: number;
	readonly rowspan?: number;
	readonly source?: SourceLocation;
}

export interface PdfLayoutRuleBlock extends PdfLayoutNodeBase {
	readonly kind: 'rule-block';
	readonly thickness: number;
}

export interface PdfTextLine {
	readonly runs: readonly PdfTextRun[];
	readonly width?: number;
	readonly source?: SourceLocation;
}

export interface PdfTextRun {
	readonly text: string;
	readonly style: PdfTextStyle;
	readonly href?: string;
	readonly source?: SourceLocation;
}

export interface PdfTextStyle {
	readonly fontFamily?: string;
	readonly fontSize?: number;
	readonly fontWeight?: 'normal' | 'bold';
	readonly fontStyle?: 'normal' | 'italic';
	readonly textDecoration?: 'none' | 'underline' | 'line-through';
	readonly color?: string;
	readonly monospace?: boolean;
}