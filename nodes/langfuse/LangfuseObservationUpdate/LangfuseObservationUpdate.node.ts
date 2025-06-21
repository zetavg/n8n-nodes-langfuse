import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError, } from 'n8n-workflow';

import { getConnectedObservation, OBSERVATION_NODE_CONNECTION_TYPE } from '../lib/connection-helpers';
import { langfuseObservationUpdateParameters } from '../lib/properties';
import { LANGFUSE_OBSERVATION_NODES } from '../lib/constants';

export class LangfuseObservationUpdate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Update Langfuse Observation',
		name: 'langfuseObservationUpdate',
		icon: 'file:langfuse.svg',
		group: ['transform'],
		version: [1],
		description: 'Update a Langfuse observation',
		defaults: {
			name: 'Update Observation',
		},
		codex: {},
		inputs: [
			NodeConnectionType.Main,
			{
				type: OBSERVATION_NODE_CONNECTION_TYPE,
				displayName: 'Observation',
				required: true,
				maxConnections: 1,
				filter: {
					nodes: LANGFUSE_OBSERVATION_NODES,
				}
			},
		],
		outputs: `={{ $parameter.enableOutputs ? ['main'] : [] }}`,
		properties: [
			langfuseObservationUpdateParameters.definition,
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

		const observation = await getConnectedObservation(this);
		if (!observation) {
			throw new NodeOperationError(this.getNode(), 'No observation connected to this node')
		}

		observation.update(langfuseObservationUpdateParameters.getter(this))

		return [items];
	}
}
