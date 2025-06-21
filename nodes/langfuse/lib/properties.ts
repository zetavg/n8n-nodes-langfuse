import { IExecuteFunctions, INodeProperties, NodeOperationError } from 'n8n-workflow';

import { validateAnyInput, validateJsonInput, validateStringInput } from './validators';

type NodeParameterGetter<T = unknown> = (
	ctx: Pick<IExecuteFunctions, 'getNode' | 'getNodeParameter'>,
	parameterPrefix?: string,
) => T;

interface Property {
	definition: INodeProperties;
	getter: NodeParameterGetter;
}

export const ADDITIONAL_PROPERTIES_WARNING_SENTENCE =
	'You need to make sure that the additional properties you pass have the correct type, otherwise Langfuse logging will fail silently without any error.';

function stringGetterFactory(name: string) {
	return ((ctx, parameterPrefix = '') => {
		const value = ctx.getNodeParameter(`${parameterPrefix}${name}`, 0, null);
		if (!value) return undefined;

		return validateStringInput(
			ctx.getNode(),
			`${parameterPrefix}${name}`,
			value,
		);
	}) satisfies NodeParameterGetter<string | undefined>;
}

function anyGetterFactory(name: string) {
	return ((ctx, parameterPrefix = '') => {
		return validateAnyInput(
			ctx.getNode(),
			`${parameterPrefix}${name}`,
			ctx.getNodeParameter(`${parameterPrefix}${name}`, 0, null),
		);
	}) satisfies NodeParameterGetter<unknown>;
}

function dateTimeGetterFactory(name: string) {
	return ((ctx, parameterPrefix = '') => {
		const valueIn = ctx.getNodeParameter(`${parameterPrefix}${name}`, 0, null);
		if (valueIn === null || valueIn === undefined) {
			return undefined;
		}

		if (typeof valueIn === 'boolean' || typeof valueIn === 'object') {
			throw new NodeOperationError(
				ctx.getNode(),
				`Input ${parameterPrefix}${name} should be a string or a number, got ${typeof valueIn} instead.`,
			);
		}

		const date = new Date(valueIn);

		// return date.toISOString();
		return date;
	}) satisfies NodeParameterGetter<unknown>;
}

const lfIdProperty = {
	definition: {
		displayName: 'ID',
		name: 'id',
		type: 'string',
		default: '',
	},
	getter: stringGetterFactory('id'),
} satisfies Property;

const lfNameProperty = {
	definition: {
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
	},
	getter: stringGetterFactory('name'),
} satisfies Property;

const lfUserIdProperty = {
	definition: {
		displayName: 'UserId',
		name: 'userId',
		type: 'string',
		default: '',
	},
	getter: stringGetterFactory('userId'),
} satisfies Property;

const lfInputProperty = {
	definition: {
		displayName: 'Input',
		name: 'input',
		type: 'json',
		default: '',
	},
	getter: anyGetterFactory('input'),
} satisfies Property;

const lfOutputProperty = {
	definition: {
		displayName: 'Output',
		name: 'output',
		type: 'json',
		default: '',
	},
	getter: anyGetterFactory('output'),
} satisfies Property;

const lfSessionIdProperty = {
	definition: {
		displayName: 'SessionId',
		name: 'sessionId',
		type: 'string',
		default: '',
	},
	getter: stringGetterFactory('sessionId'),
} satisfies Property;

const lfReleaseProperty = {
	definition: {
		displayName: 'Release',
		name: 'release',
		type: 'string',
		default: '',
	},
	getter: stringGetterFactory('release'),
} satisfies Property;

const lfVersionProperty = {
	definition: {
		displayName: 'Version',
		name: 'version',
		type: 'string',
		default: '',
	},
	getter: stringGetterFactory('version'),
} satisfies Property;

const lfMetadataProperty = {
	definition: {
		displayName: 'Metadata',
		name: 'metadata',
		type: 'json',
		default: '',
	},
	getter: anyGetterFactory('metadata'),
} satisfies Property;

const lfEnvironmentProperty = {
	definition: {
		displayName: 'Environment',
		name: 'environment',
		type: 'string',
		default: '',
		description: 'Environments allow you to organize your traces, observations, and scores from different contexts such as production, staging, or development',
	},
	getter: stringGetterFactory('environment'),
} satisfies Property;

const lfStartTimeProperty = {
	definition: {
		displayName: 'Start Time',
		name: 'startTime',
		type: 'string',
		default: '',
	},
	getter: dateTimeGetterFactory('startTime'),
} satisfies Property;

const lfEndTimeProperty = {
	definition: {
		displayName: 'End Time',
		name: 'endTime',
		type: 'string',
		default: '',
	},
	getter: dateTimeGetterFactory('endTime'),
} satisfies Property;

// const generalLangfuseObjectProperties = [lfInputProperty, lfOutputProperty, lfMetadataProperty];
const lfTraceProperties = [
	// timestamp
	lfNameProperty,
	lfUserIdProperty,
	lfInputProperty,
	lfOutputProperty,
	lfSessionIdProperty,
	lfReleaseProperty,
	lfVersionProperty,
	lfMetadataProperty,
	// lfTagsProperty,
	lfEnvironmentProperty,
	// public
];

const lfCreateTraceProperties = [
	lfIdProperty,
	...lfTraceProperties,
]

const lfObservationProperties = [
	lfNameProperty,
	lfInputProperty,
	lfOutputProperty,
	lfVersionProperty,
	lfMetadataProperty,
	lfEnvironmentProperty,
	lfStartTimeProperty,
	lfEndTimeProperty,
	// {
	// 	definition: {
	// 		displayName: 'Completion Start Time',
	// 		name: 'completionStartTime',
	// 		type: 'string',
	// 		default: '',
	// 		displayOptions: {
	// 			show: {
	// 				observationType: ['generation']
	// 			}
	// 		}
	// 	},
	// 	getter: dateTimeGetterFactory('completionStartTime'),
	// } satisfies Property,
	// level
	// statusMessage
]

const lfCreateObservationProperties = [
	lfIdProperty,
	...lfObservationProperties,
]

export const langfuseTraceCreateParameters = getLangfuseObjectNodeProperty({
	properties: [...lfCreateTraceProperties],
	additionalPropertiesDescription:
		'See: https://js.reference.langfuse.com/classes/langfuse.Langfuse.html#trace',
});

export const langfuseTraceUpdateParameters = getLangfuseObjectNodeProperty({
	properties: [...lfTraceProperties],
	additionalPropertiesDescription:
		'See: https://js.reference.langfuse.com/classes/langfuse.LangfuseTraceClient.html#update',
});

export const langfuseObservationCreateParameters = getLangfuseObjectNodeProperty({
	properties: [...lfCreateObservationProperties],
	additionalPropertiesDescription:
		'See: https://js.reference.langfuse.com/classes/langfuse.LangfuseTraceClient.html#span or https://js.reference.langfuse.com/classes/langfuse.LangfuseTraceClient.html#generation',
});

export const langfuseObservationUpdateParameters = getLangfuseObjectNodeProperty({
	properties: [...lfObservationProperties],
	additionalPropertiesDescription:
		'See: See: https://js.reference.langfuse.com/classes/langfuse.LangfuseSpanClient.html#update or https://js.reference.langfuse.com/classes/langfuse.LangfuseGenerationClient.html#update',
});

function getLangfuseObjectNodeProperty({
	properties,
	additionalPropertiesDescription,
}: {
	properties: Property[];
	additionalPropertiesDescription: string;
}) {
	const name = 'properties';
	const childrenParameterPrefix = `${name}.`;

	const additionalPropertiesProperty = getAdditionalPropertiesProperty({
		description: additionalPropertiesDescription,
	});

	const definition = {
		displayName: 'Properties',
		name,
		type: 'collection',
		default: {},
		placeholder: 'Add',
		options: [
			...properties.map((property) => property.definition),
			additionalPropertiesProperty.definition,
		],
	} satisfies INodeProperties;

	const getter = ((ctx, parameterPrefixIn = '') => {
		const parameterPrefix = `${parameterPrefixIn}${childrenParameterPrefix}`;

		const collectedProperties: Record<string, unknown> = {};

		for (const property of properties) {
			const name = property.definition.name;
			const value = property.getter(ctx, parameterPrefix);

			if (value !== undefined && value !== null) {
				collectedProperties[name] = value;
			}
		}

		const additionalProperties = additionalPropertiesProperty.getter(
			ctx,
			parameterPrefix,
		);

		return {
			...collectedProperties,
			...additionalProperties,
			// Maybe not needed, just don't specify metadata in the additional properties
			// ...(collectedProperties.metadata &&
			// 	typeof collectedProperties.metadata === 'object' &&
			// 	additionalProperties.metadata &&
			// 	typeof additionalProperties.metadata === 'object'
			// 	? {
			// 		metadata: {
			// 			// TODO: deep merge metadata objects
			// 			...collectedProperties.metadata,
			// 			...additionalProperties.metadata,
			// 		},
			// 	}
			// 	: {}),
		};
	}) satisfies NodeParameterGetter;

	return { definition, getter } satisfies Property;
}

/**
 * Additional properties to assign to a Langfuse trace or observation.
 */
function getAdditionalPropertiesProperty({
	description,
}: {
	description: string;
}) {
	const definition = {
		displayName: 'Additional Properties',
		name: 'additionalProperties',
		type: 'json',
		default: '{}',
		placeholder: '{}',
		description: `${ADDITIONAL_PROPERTIES_WARNING_SENTENCE} ${description}`,
	} satisfies INodeProperties;

	const getter = ((ctx, parameterPrefix = '') => {
		const additionalProperties = validateJsonInput(
			ctx.getNode(),
			`${parameterPrefix}additionalProperties`,
			ctx.getNodeParameter(`${parameterPrefix}additionalProperties`, 0, '{}'),
		);

		return additionalProperties;
	}) satisfies NodeParameterGetter;

	return { definition, getter } satisfies Property;
}
