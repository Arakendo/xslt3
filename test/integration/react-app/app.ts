import generated from './generated/typed-params.xsl';

type TransformContext = Parameters<typeof generated.transform>[1];
type StylesheetParameters = NonNullable<NonNullable<TransformContext>['parameters']>;

declare const typedParameters: StylesheetParameters;

typedParameters.title.toUpperCase();
typedParameters.count?.toFixed(0);
typedParameters.enabled === true;
typedParameters.tags?.map((tag) => tag.toUpperCase());

generated.transform('<root/>', {
  parameters: {
    title: 'Invoice',
    count: 3,
    enabled: true,
    tags: ['a', 'b'],
  },
});