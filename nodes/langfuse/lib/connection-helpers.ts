import { LangfuseGenerationClient, LangfuseSpanClient, LangfuseTraceClient } from "langfuse";
import { IExecuteFunctions, NodeConnectionType, NodeOperationError } from "n8n-workflow";

export const TRACE_NODE_CONNECTION_TYPE = NodeConnectionType.AiChain
export const OBSERVATION_NODE_CONNECTION_TYPE = NodeConnectionType.AiChain

export async function getConnectedTraceOrObservation(ctx: Pick<IExecuteFunctions, 'getInputConnectionData' | 'logger' | 'getNode'>): Promise<LangfuseTraceClient | LangfuseSpanClient |
	LangfuseGenerationClient | undefined> {
	let error
	try {
		const trace = await getConnectedTrace(ctx);
		if (trace) {
			return trace;
		}
	} catch (e) {
		error = e
	}

	try {
		const observation = await getConnectedObservation(ctx);
		if (observation) {
			return observation;
		}
	} catch (e) {
		error = e
	}

	if (error) {
		throw error
	}

	return undefined;
}

export async function getConnectedTrace(ctx: Pick<IExecuteFunctions, 'getInputConnectionData' | 'logger' | 'getNode'>): Promise<LangfuseTraceClient | undefined> {

	let trace = (await ctx.getInputConnectionData(
		TRACE_NODE_CONNECTION_TYPE,
		0,
	));

	if (Array.isArray(trace)) {
		trace = trace[0];
	}

	if (!trace) return undefined;

	if (trace.constructor.name === 'LangfuseTraceClient') {
		return trace as LangfuseTraceClient;
	} else {
		throw new NodeOperationError(ctx.getNode(), `Connected Trace is not likely a LangfuseTraceClient. Got ${typeof trace} (${trace?.constructor?.name}) Make sure to connect a Langfuse trace node to this node.`);
	}
}


export async function getConnectedObservation(ctx: Pick<IExecuteFunctions, 'getInputConnectionData' | 'logger' | 'getNode'>): Promise<LangfuseSpanClient |
	LangfuseGenerationClient | undefined> {

	let observation = (await ctx.getInputConnectionData(
		OBSERVATION_NODE_CONNECTION_TYPE,
		0,
	));

	if (Array.isArray(observation)) {
		observation = observation[0];
	}

	if (!observation) return undefined;

	if (observation.constructor.name === 'LangfuseSpanClient') {
		return observation as LangfuseSpanClient;
	} else if (observation.constructor.name === 'LangfuseGenerationClient') {
		return observation as LangfuseGenerationClient;
	} else {
		throw new NodeOperationError(ctx.getNode(), `Connected Trace is not likely a LangfuseSpanClient or LangfuseGenerationClient. Got ${typeof observation} (${observation?.constructor?.name}) Make sure to connect a Langfuse observation node to this node.`);
	}
}
