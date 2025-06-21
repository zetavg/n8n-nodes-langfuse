import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

export class LogCurrentTime implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Log Current Time',
		name: 'logCurrentTime',
		// icon: 'fa:clock',
		icon: {
			light: 'file:clock.svg',
			dark: 'file:clock.svg',
		},
		group: ['transform'],
		version: 1,
		description: 'Logs the current time into the output data when executed',
		defaults: {
			name: 'Log Current Time',
		},
		inputs: [
			{
				type: NodeConnectionType.Main,
				required: true,
				maxConnections: 1,
			},
		],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: 'timestamp',
				placeholder: 'timestamp',
				description: 'The key under which the current time will be stored in the output data',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const currentTime = Date.now();

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const key = this.getNodeParameter('key', itemIndex, '') as string;
			const item = items[itemIndex];
			item.json[key] = currentTime;
		}

		return [items];
	}
}
