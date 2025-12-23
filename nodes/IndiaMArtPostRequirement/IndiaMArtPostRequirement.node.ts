import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class IndiaMArtPostRequirement implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IndiaMART Post Requirement',
		name: 'indiaMArtPostRequirement',
		icon: 'file:../icon.svg',
		group: ['output'],
		version: 1,
		description: 'Post a product requirement on IndiaMART using the saveEnrichment API',
		defaults: {
			name: 'IndiaMART Post Requirement',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Product Name',
				name: 'productName',
				type: 'string',
				default: '',
				placeholder: 'e.g., Pave Diamond Pendant',
				description: 'Product name for the requirement',
				required: true,
			},
			{
				displayName: 'Contact',
				name: 'contact',
				type: 'string',
				default: '',
				placeholder: 'e.g., user@email.com or +1234567890',
				description: 'Contact number or email address',
				required: true,
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
				const contact = this.getNodeParameter('contact', itemIndex, '') as string;
				item = items[itemIndex];

				const postResponse = await this.helpers.httpRequest({
					method: 'POST',
					url: 'http://localhost:3000/api/saveEnrichment/',
					json: {
						category_type: 'P',
						curr_page_url: '',
						glcat_mcat_id: '191662',
						iso: 'IN',
						modref_type: 'product',
						prod_serv: 'P',
						rfq_cat_id: '614',
						rfq_query_ref_text: 'ctaName=Post Requirement|ctaType=Sourcing BL Form|Export',
						rfq_ref_url: '',
						rfq_sender_id: '31400302',
						rfq_subject: productName,
					},
				} as any);

				// Return success response
				item.json.success = true;
				item.json.productName = productName;
				item.json.contact = contact;
				item.json.postResponse = postResponse;
			} catch (error) {
				// Handle errors appropriately
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
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
