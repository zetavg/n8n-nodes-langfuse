import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError, } from 'n8n-workflow';

import { getConnectedTrace, TRACE_NODE_CONNECTION_TYPE } from '../lib/connection-helpers';
import { langfuseTraceUpdateParameters } from '../lib/properties';
import { LANGFUSE_TRACE_NODES } from '../lib/constants';

export class LangfuseTraceUpdate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Update Langfuse Trace',
		name: 'langfuseTraceUpdate',
		icon: 'file:langfuse.svg',
		group: ['transform'],
		version: [1],
		description: 'Update a Langfuse trace',
		defaults: {
			name: 'Update Trace',
		},
		codex: {},
		inputs: [
			NodeConnectionType.Main,
			{
				type: TRACE_NODE_CONNECTION_TYPE,
				displayName: 'Trace',
				required: true,
				maxConnections: 1,
				filter: {
					nodes: LANGFUSE_TRACE_NODES,
				},
			},
		],
		outputs: `={{ $parameter.enableOutputs ? ['main'] : [] }}`,
		properties: [
			langfuseTraceUpdateParameters.definition,
			{
				displayName: 'Enable Outputs',
				name: 'enableOutputs',
				type: 'boolean',
				default: false,
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const trace = await getConnectedTrace(this);
		if (!trace) {
			throw new NodeOperationError(this.getNode(), 'No trace connected to this node')
		}

		trace.update(langfuseTraceUpdateParameters.getter(this));

		return [items];
	}
}
