import {
	NodeOperationError,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';
// @ts-ignore should be included in n8n
import { toBase64 } from 'js-base64';
import { getConnectedTrace, OBSERVATION_NODE_CONNECTION_TYPE, TRACE_NODE_CONNECTION_TYPE } from '../lib/connection-helpers';
import { langfuseObservationCreateParameters } from '../lib/properties';
import { getN8nMetadata } from '../lib/utils';
import { LANGFUSE_TRACE_NODES } from '../lib/constants';

export class LangfuseObservation implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Langfuse Observation',
		name: 'langfuseObservation',
		icon: 'file:langfuse.svg',
		group: ['transform'],
		version: [1],
		subtitle: `={{ (${formatSubtitle})($parameter) }}`,
		description: 'Defines a Langfuse observation',
		defaults: {
			name: 'Observation',
		},
		codex: {},
		inputs: [
			{
				type: TRACE_NODE_CONNECTION_TYPE,
				displayName: 'Trace',
				required: false,
				maxConnections: 1,
				filter: {
					nodes: LANGFUSE_TRACE_NODES,
				}
			},
		],
		outputs: [OBSERVATION_NODE_CONNECTION_TYPE],
		properties: [
			{
				displayName: 'Type',
				name: 'observationType',
				type: 'options',
				description: 'See: https://langfuse.com/docs/tracing-data-model#observation-types',
				default: 'span',
				options: [
					// {
					// 	name: 'Event',
					// 	value: 'event',
					// 	description: 'Events are the basic building blocks, they are used to track discrete events in a trace',
					// },
					{
						name: 'Span',
						value: 'span',
						description: 'Spans represent durations of units of work in a trace',
					},
					{
						name: 'Generation',
						value: 'generation',
						description: 'Generations are spans used to log generations of AI models including prompts, token usage and costs',
					},
				],
			},
			langfuseObservationCreateParameters.definition,
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const trace = await getConnectedTrace(this);
		if (!trace) {
			throw new NodeOperationError(this.getNode(), 'No connected trace found. Please connect a Langfuse trace node.')
		}

		const observationType = this.getNodeParameter('observationType', itemIndex, 'generation');

		if (observationType !== 'span' && observationType !== 'generation') {
			throw new NodeOperationError(
				this.getNode(),
				`Invalid observation type: ${observationType}. Supported types are 'span' and 'generation'.`,
			);
		}

		const n8nMetadata = getN8nMetadata(this)

		const params = langfuseObservationCreateParameters.getter(this)

		const observation = trace[observationType]({
			// Must provide a unique ID here to prevent duplicate traces since
			// n8n may call `supplyData` multiple times for the same node.
			id: `n8n-${n8nMetadata.workflow.id}-${n8nMetadata.executionId}-${toBase64(this.getNode().name, true)}`,
			...params,
		});

		return {
			response: observation,
		};
	}
}

function formatSubtitle({ observationType }: { observationType: string }) {
	return observationType
		.toLowerCase()
		.split(' ')
		.map(word =>
			word.charAt(0).toUpperCase() + word.slice(1)
		)
		.join(' ');
}
