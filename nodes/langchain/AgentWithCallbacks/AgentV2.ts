// https://github.com/n8n-io/n8n/blob/n8n%401.97.0/packages/%40n8n/nodes-langchain/nodes/agents/Agent/V2/AgentV2.node.ts

// @ts-ignore
import { AgentV2 as UpstreamAgentV2 } from '@n8n/n8n-nodes-langchain/dist/nodes/agents/Agent/V2/AgentV2.node';
import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeBaseDescription, INodeTypeDescription } from 'n8n-workflow';
import { toolsAgentExecute } from './execute';
import { PACKAGE_NAMES } from '../../langfuse/lib/constants';

export class AgentV2 extends UpstreamAgentV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		super(baseDescription);

		const patchedInputs = (() => {
			// @ts-ignore this.description should be assigned in the super constructor
			const origInputs = this.description.inputs;

			if (typeof origInputs !== 'string') {
				throw new Error('[AgentWithCallbacks] Expect description.inputs of the upstream AgentV2 to be a string, but got: ' + typeof origInputs);
			}

			let patched: string = origInputs

			patched = replaceExactOnce(patched, /displayNames ?= ?{/, `displayNames = { ai_chain: "Callback",`)
			patched = replaceExactOnce(patched, /["']@n8n\/n8n-nodes-langchain\.lmChatAnthropic["'],/, `"@n8n/n8n-nodes-langchain.lmChatAnthropic", ${PACKAGE_NAMES.map(n => `"${n}.modelWithLangfuse"`).join(', ')},`)
			patched = replaceExactOnce(patched, /return \[["']main["']/, `specialInputs.push({ type: "ai_chain" }); return ["main"`)

			return patched
		})()

		this.description = {
			// @ts-ignore this.description should be assigned in the super constructor
			...this.description,
			inputs: patchedInputs as any,
			// inputs: `={{
			// 	((hasOutputParser) => {
			// 		${getInputs.toString()};
			// 		return getInputs(hasOutputParser)
			// 	})($parameter.hasOutputParser === undefined || $parameter.hasOutputParser === true)
			// }}`,
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return await toolsAgentExecute.call(this);
	}
}

function replaceExactOnce(input: string, regex: RegExp, replacement: string) {
	const matches = input.match(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g'));

	if (!matches || matches.length !== 1) {
		throw new Error(`[AgentWithCallbacks] Expected exactly one match for pattern ${regex}, but found ${matches ? matches.length : 0}: ${input}`);
	}

	return input.replace(regex, replacement);
}
