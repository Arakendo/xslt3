import type { SourceLocation } from '../errors/index.js';

export interface PdfDocumentNode {
	readonly kind: 'document';
	readonly location?: SourceLocation;
	readonly children: readonly PdfBlockNode[];
}

export type PdfBlockNode =
	| PdfHeadingNode
	| PdfParagraphNode
	| PdfBlockQuoteNode
	| PdfListNode
	| PdfListItemNode
	| PdfCodeBlockNode
	| PdfThematicBreakNode
	| PdfImageBlockNode
	| PdfTableNode
	| PdfTableRowNode
	| PdfTableCellNode;

export type PdfInlineNode =
	| PdfTextNode
	| PdfEmphasisNode
	| PdfStrongNode
	| PdfDeleteNode
	| PdfInlineCodeNode
	| PdfLinkNode
	| PdfInlineImageNode
	| PdfLineBreakNode;

interface PdfNodeBase {
	readonly kind: string;
	readonly location?: SourceLocation;
}

export interface PdfHeadingNode extends PdfNodeBase {
	readonly kind: 'heading';
	readonly level: 1 | 2 | 3 | 4 | 5 | 6;
	readonly children: readonly PdfInlineNode[];
}

export interface PdfParagraphNode extends PdfNodeBase {
	readonly kind: 'paragraph';
	readonly children: readonly PdfInlineNode[];
}

export interface PdfBlockQuoteNode extends PdfNodeBase {
	readonly kind: 'blockquote';
	readonly children: readonly PdfBlockNode[];
}

export interface PdfListNode extends PdfNodeBase {
	readonly kind: 'list';
	readonly ordered: boolean;
	readonly start?: number;
	readonly children: readonly PdfListItemNode[];
}

export interface PdfListItemNode extends PdfNodeBase {
	readonly kind: 'list-item';
	readonly children: readonly PdfBlockNode[];
}

export interface PdfCodeBlockNode extends PdfNodeBase {
	readonly kind: 'code-block';
	readonly language?: string;
	readonly value: string;
}

export interface PdfThematicBreakNode extends PdfNodeBase {
	readonly kind: 'thematic-break';
}

export interface PdfImageResource {
	readonly uri: string;
	readonly altText?: string;
	readonly title?: string;
}

export interface PdfImageBlockNode extends PdfNodeBase {
	readonly kind: 'image-block';
	readonly image: PdfImageResource;
}

export interface PdfTableNode extends PdfNodeBase {
	readonly kind: 'table';
	readonly headerRows: readonly PdfTableRowNode[];
	readonly bodyRows: readonly PdfTableRowNode[];
	readonly alignments: readonly PdfTableColumnAlignment[];
}

export type PdfTableColumnAlignment = 'left' | 'center' | 'right';

export interface PdfTableRowNode extends PdfNodeBase {
	readonly kind: 'table-row';
	readonly children: readonly PdfTableCellNode[];
}

export interface PdfTableCellNode extends PdfNodeBase {
	readonly kind: 'table-cell';
	readonly header: boolean;
	readonly children: readonly PdfBlockNode[];
}

export interface PdfTextNode extends PdfNodeBase {
	readonly kind: 'text';
	readonly value: string;
}

export interface PdfEmphasisNode extends PdfNodeBase {
	readonly kind: 'emphasis';
	readonly children: readonly PdfInlineNode[];
}

export interface PdfStrongNode extends PdfNodeBase {
	readonly kind: 'strong';
	readonly children: readonly PdfInlineNode[];
}

export interface PdfDeleteNode extends PdfNodeBase {
	readonly kind: 'delete';
	readonly children: readonly PdfInlineNode[];
}

export interface PdfInlineCodeNode extends PdfNodeBase {
	readonly kind: 'inline-code';
	readonly value: string;
}

export interface PdfLinkNode extends PdfNodeBase {
	readonly kind: 'link';
	readonly href: string;
	readonly title?: string;
	readonly children: readonly PdfInlineNode[];
}

export interface PdfInlineImageNode extends PdfNodeBase {
	readonly kind: 'image-inline';
	readonly image: PdfImageResource;
}

export interface PdfLineBreakNode extends PdfNodeBase {
	readonly kind: 'line-break';
	readonly hard: boolean;
}