import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError, } from 'n8n-workflow';
import { validateJsonInput } from '../lib/validators';
import { getLangfuseKeys } from '../lib/utils';
import Langfuse from 'langfuse';

export class LangfuseGetPrompt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Get Prompt',
		name: 'langfuseGetPrompt',
		icon: 'file:langfuse.svg',
		group: ['transform'],
		version: [1],
		description: 'Get a prompt from Langfuse',
		defaults: {
			name: 'Get Prompt',
		},
		codex: {},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'langfuseApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'prompt-name',
				description: 'TODO',
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'number',
				default: 0,
				placeholder: 'prompt-name',
				description: 'TODO',
			},
			{
				displayName: 'Prompt Key Name',
				name: 'promptKeyName',
				type: 'string',
				required: true,
				default: 'prompt',
				placeholder: 'prompt',
				description: 'The key under which the prompt will be stored in the output data',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Additional Options',
						name: 'additionalOptions',
						type: 'json',
						default: '{}',
						placeholder: '{}',
						description: 'See: https://js.reference.langfuse.com/classes/langfuse.Langfuse.html#getPrompt',
					},
				],
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const {
			LANGFUSE_HOST,
			LANGFUSE_PUBLIC_KEY,
			LANGFUSE_SECRET_KEY,
		} = await getLangfuseKeys(this);

		const langfuse = new Langfuse({
			baseUrl: LANGFUSE_HOST,
			publicKey: LANGFUSE_PUBLIC_KEY,
			secretKey: LANGFUSE_SECRET_KEY,
		});

		const name = this.getNodeParameter('name', 0);
		if (typeof name !== 'string') {
			throw new NodeOperationError(
				this.getNode(),
				`Name must be a string, got ${typeof name}`,
			);
		}

		const version = this.getNodeParameter('version', 0, 0);
		if (typeof version !== 'number') {
			throw new NodeOperationError(
				this.getNode(),
				`Version must be a string, got ${typeof version}`,
			);
		}

		const promptKeyName = this.getNodeParameter('promptKeyName', 0, 'prompt');
		if (typeof promptKeyName !== 'string') {
			throw new NodeOperationError(
				this.getNode(),
				`promptKeyName must be a string, got ${typeof promptKeyName}`,
			);
		}

		const additionalOptions = validateJsonInput(
			this.getNode(),
			'options.additionalOptions',
			this.getNodeParameter('options.additionalOptions', 0, '{}'),
		);

		const prompt = await langfuse.getPrompt(name, version, {
			...additionalOptions,
		});

		const promptJson = prompt.toJSON();
		const promptObject = JSON.parse(promptJson);

		const items = this.getInputData();

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];
			item.json[promptKeyName] = promptObject;
		}

		return [items];
	}
}
