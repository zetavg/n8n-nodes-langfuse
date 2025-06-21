import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { Langfuse } from 'langfuse';
// @ts-ignore should be included in n8n
import { toBase64 } from 'js-base64';

import { getLangfuseKeys, getN8nMetadata } from '../lib/utils';;
import { TRACE_NODE_CONNECTION_TYPE } from '../lib/connection-helpers';
import { langfuseTraceCreateParameters } from '../lib/properties';

export class LangfuseTrace implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Langfuse Trace',
		name: 'langfuseTrace',
		icon: 'file:langfuse.svg',
		group: ['transform'],
		version: [1],
		description: 'Defines a Langfuse trace',
		defaults: {
			name: 'Trace',
		},
		codex: {},
		inputs: [],
		outputs: [TRACE_NODE_CONNECTION_TYPE],
		credentials: [
			{
				name: 'langfuseApi',
				required: true,
			},
		],
		properties: [
			langfuseTraceCreateParameters.definition,
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const {
			LANGFUSE_HOST,
			LANGFUSE_PUBLIC_KEY,
			LANGFUSE_SECRET_KEY,
		} = await getLangfuseKeys(this);

		const langfuse = new Langfuse({
			baseUrl: LANGFUSE_HOST,
			publicKey: LANGFUSE_PUBLIC_KEY,
			secretKey: LANGFUSE_SECRET_KEY,
			flushAt: 1,
		});

		const n8nMetadata = getN8nMetadata(this)

		const params = langfuseTraceCreateParameters.getter(this)

		const trace = langfuse.trace({
			// Must provide a unique ID here to prevent duplicate traces since
			// n8n may call `supplyData` multiple times for the same node.
			id: `n8n-${n8nMetadata.workflow.id}-${n8nMetadata.executionId}-${toBase64(this.getNode().name, true)}`,
			// Ref: getTracingConfig (https://github.com/n8n-io/n8n/blob/n8n%401.97.0/packages/%40n8n/nodes-langchain/utils/tracing.ts#L8-L26)
			name: `${n8nMetadata.workflow.name} #${n8nMetadata.executionId}`,
			...params,
			metadata: {
				n8n: n8nMetadata,
				...params.metadata,
			},
		});

		return {
			response: trace,
		};
	}
}
