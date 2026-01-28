import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IN8nHttpFullResponse,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';


export class IndiaMArtPostRequirement implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IndiaMART Post Requirement',
		name: 'indiaMArtPostRequirement',
		icon: 'file:../icon.svg',
		group: ['output'],
		version: 1,
		description: 'Post a product requirement on IndiaMART',
		defaults: {
			name: 'IndiaMART Post Requirement',
		},
		credentials: [
			{
				name: 'indiaMartApi',
				required: true,
			},
		],
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Product Name',
				name: 'productName',
				type: 'string',
				default: '',
				placeholder: 'water purifier, office chair',
				description: 'Product name for the requirement',
				required: true,
			},
			{
				displayName: 'Quantity',
				name: 'quantity',
				type: 'number',
				default: 1,
				placeholder: '10',
				description: 'Quantity required (must be greater than 0)',
				required: true,
				typeOptions: {
					minValue: 1,
				},
			},
			{
				displayName: 'Quantity Unit',
				name: 'quantityUnit',
				type: 'string',
				default: 'Piece',
				placeholder: 'Piece, Kg, Ton, Box',
				description: 'Unit of measurement for the quantity',
				required: true,
			},
			{
				displayName: 'Additional Requirements',
				name: 'additionalRequirements',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'Any specific requirements, preferences, or details...',
				description: 'Additional information about your requirement',
			},
		],
	};

	// The function below is responsible for posting a requirement
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		// Iterates over all input items and posts requirement to IndiaMART
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const productName = this.getNodeParameter('productName', itemIndex, '') as string;
				const credentials = await this.getCredentials('indiaMartApi');
				const secretKey = credentials.secretKey as string;
				const quantity = this.getNodeParameter('quantity', itemIndex, 1) as number;
				const quantityUnit = this.getNodeParameter('quantityUnit', itemIndex, 'Piece') as string;
				const additionalRequirements = this.getNodeParameter('additionalRequirements', itemIndex, '') as string;
				item = items[itemIndex];

				// Validate quantity (must be greater than 0)
				if (quantity <= 0) {
					throw new NodeOperationError(
						this.getNode(),
						'Quantity must be greater than 0',
						{ itemIndex }
					);
				}

				// Validate quantity unit (alphabets only with spaces)
				if (quantityUnit && !/^[a-zA-Z\s]+$/.test(quantityUnit)) {
					throw new NodeOperationError(
						this.getNode(),
						'Quantity unit must contain only alphabets (a-z, A-Z) and spaces',
						{ itemIndex }
					);
				}
				/* ---------------- SINGLE API POST ---------------- */
				const apiUrl = 'https://export.indiamart.com/cgi/postRequirement.php';
				const payload = {
					productName,
					secretKey,
					quantity,
					quantityUnit,
					additionalRequirements,
				};

				try {
					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: apiUrl,
						body: payload,
						headers: {
							'Content-Type': 'application/json',
						},
						json: true,
						returnFullResponse: true,
						ignoreHttpStatusErrors: true,
					}) as IN8nHttpFullResponse;

					// Check for specific error message: {"status":"error","message":"Invalid or expired secret key"}
					const responseBody = response.body;
					const bodyString = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);

					if (bodyString.includes('Invalid or expired secret key')) {
						item.json = {
							message: 'Invalid or expired secret key',
						};
						continue;
					}

					// For any other non-2xx response, throw error
					if (response.statusCode >= 400) {
						throw new NodeOperationError(this.getNode(), `Post Requirement failed: ${JSON.stringify(response.body)}`, {
							itemIndex,
						});
					}

				} catch (error) {
					if (error instanceof NodeOperationError) {
						throw error;
					}
					throw new NodeOperationError(this.getNode(), `Post Requirement failed: ${error.message}`, {
						itemIndex,
					});
				}

				item.json = {
					message: 'Successfully posted requirement on IndiaMART',
				};

			} catch (error) {
				if (this.continueOnFail()) {
					items.push({
						json: {
							...this.getInputData(itemIndex)[0].json,
							success: false,
							error: error.message,
						},
						error,
						pairedItem: itemIndex
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}