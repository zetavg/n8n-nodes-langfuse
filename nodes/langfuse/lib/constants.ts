export const PACKAGE_NAMES = [
	'CUSTOM',
	'n8n-nodes-langfuse',
	'@zetavg/n8n-nodes-langfuse',
]

export const LANGFUSE_TRACE_NODES = PACKAGE_NAMES.map((packageName) => `${packageName}.langfuseTrace`);

export const LANGFUSE_OBSERVATION_NODES = PACKAGE_NAMES.map((packageName) => `${packageName}.langfuseObservation`);
