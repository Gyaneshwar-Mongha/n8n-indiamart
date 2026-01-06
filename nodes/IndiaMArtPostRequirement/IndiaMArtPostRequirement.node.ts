import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { ApplicationError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

/* =======================
   TYPES
======================= */
interface AISelectedProduct {
	name: string;
	number?: string;
	companyname?: string;
	image?: string;
	user_info?: string;
}

/* =======================
   PARSER
======================= */
function parseAIOutput(raw: unknown): AISelectedProduct | null {
	if (typeof raw !== 'string') {
		throw new ApplicationError('AI output is not a string');
	}

	const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

	let parsed: unknown;
	try {
		parsed = JSON.parse(cleaned);
	} catch {
		throw new ApplicationError('Failed to parse AI JSON string');
	}

	if (typeof parsed !== 'object' || parsed === null) {
		throw new ApplicationError('AI output is not a JSON object');
	}

	const obj = parsed as Record<string, unknown>;

	if ('bestProduct' in obj) {
		const bp = obj.bestProduct;
		if (bp === null) return null;
		if (typeof bp === 'object' && bp !== null && 'name' in bp && typeof (bp as Record<string, unknown>).name === 'string') {
			const product: AISelectedProduct = bp as AISelectedProduct;
			if ('user_info' in obj && typeof obj.user_info === 'string') {
				product.user_info = obj.user_info;
			}
			return product;
		}
	}

	throw new ApplicationError('AI output JSON does not contain a valid product');
}

/* =======================
   NODE
======================= */
export class IndiaMArtPostRequirement implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IndiaMART Post Requirement',
		name: 'indiaMArtPostRequirement',
		description: 'Post product requirements to IndiaMART',
		icon: 'file:../icon.svg',
		group: ['output'],
		version: 1,
		defaults: { name: 'IndiaMART Post Requirement' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Product Name',
				name: 'productName',
				type: 'string',
				default: '',
				description: 'If empty, AI output will be used',
			},
			{
				displayName: 'Contact (Mobile / Email)',
				name: 'contact',
				type: 'string',
				default: '',
				description: 'If empty, mobile from sheet or AI user_info will be used',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];

			try {
				// ----------------------------
				// 1. READ INPUTS
				// ----------------------------
				let productName =
					(this.getNodeParameter('productName', itemIndex, '') as string) || '';

				let contact =
					(this.getNodeParameter('contact', itemIndex, '') as string) ||
					String(item.json.mobile ?? '');

				// Use AI output if available
				if (!productName && item.json.output) {
					try {
						const aiProduct = parseAIOutput(item.json.output);

						if (!aiProduct) {
							item.json.best_product = null;
							item.json.status = 'skipped';
							item.json.message = 'AI did not select any product';
							continue;
						}

						productName = aiProduct.name;
						item.json.best_product = aiProduct;

						// Use AI user_info as contact if available
						if (aiProduct.user_info) {
							contact = aiProduct.user_info;
						}
					} catch (error) {
						throw new NodeOperationError(
							this.getNode(),
							error instanceof Error ? error.message : 'Failed to parse AI output',
							{ itemIndex }
						);
					}
				}

				if (!productName) {
					throw new NodeOperationError(
						this.getNode(),
						'Product name missing (UI input or AI output required)',
						{ itemIndex }
					);
				}

				if (!contact) {
					throw new NodeOperationError(
						this.getNode(),
						'Contact (mobile/email) is required',
						{ itemIndex }
					);
				}

				// ----------------------------
				// 2. GEO API
				// ----------------------------
				const geoInfo = await this.helpers.httpRequest({
					method: 'GET',
					url: 'https://dev-dir.indiamart.com/api/geoDetail',
					headers: {
						'User-Agent': 'n8n-nodes-indiamart',
						Accept: 'application/json',
						Authorization: 'Basic aW5kaW50ZXJtZXNoOmluZGludGVybWVzaA==',
					},
				});

				if (!geoInfo?.geo?.gcniso || !geoInfo?.geo?.gcnnm) {
					throw new NodeOperationError(this.getNode(), 'Invalid GEO API response', { itemIndex });
				}

				const countryIso = String(geoInfo.geo.gcniso);
				const countryName = String(geoInfo.geo.gcnnm);

				// ----------------------------
				// 3. LOGIN (uses AI user_info automatically)
				// ----------------------------
				const loginResponse = await this.helpers.httpRequest({
					method: 'GET',
					url: 'https://dir.indiamart.com/api/fdbklogin',
					qs: {
						username: contact,
						modid: 'DIR',
						glusr_usr_countryname: countryName,
						screen_name: 'BL/Enq Forms',
						create_user: 1,
						format: 'JSON',
						iso: countryIso,
					},
					headers: {
						'User-Agent': 'n8n-nodes-indiamart',
					},
				});

				const rfq_sender_id = loginResponse?.DataCookie?.glid;
				if (!rfq_sender_id) {
					throw new NodeOperationError(this.getNode(), 'glid not found in login', { itemIndex });
				}

				// ----------------------------
				// 4. MCAT LOOKUP
				// ----------------------------
				const mcatInfo = await this.helpers.httpRequest({
					method: 'GET',
					url: 'https://apps.imimg.com/models/mcatid-suggestion.php',
					qs: { search_param: productName },
					headers: { 'User-Agent': 'n8n-nodes-indiamart' },
				});

				if (!mcatInfo?.mcatid || !mcatInfo?.catid) {
					throw new NodeOperationError(this.getNode(), 'Invalid MCAT response', { itemIndex });
				}

				// ----------------------------
				// 5. POST REQUIREMENT
				// ----------------------------
				const postResponse = await this.helpers.httpRequest({
					method: 'POST',
					url: 'https://export.indiamart.com/api/saveEnrichment/',
					body: {
						category_type: 'P',
						glcat_mcat_id: String(mcatInfo.mcatid),
						rfq_cat_id: String(mcatInfo.catid),
						iso: countryIso,
						modref_type: 'product',
						prod_serv: 'P',
						rfq_sender_id,
						rfq_subject: productName,
						rfq_query_ref_text: 'n8n',
					},
					headers: { 'User-Agent': 'n8n-nodes-indiamart' },
				});

				if (!postResponse?.ofr || isNaN(Number(postResponse.ofr))) {
					throw new NodeOperationError(this.getNode(), 'Failed to post requirement to IndiaMART', { itemIndex });
				}

				// ----------------------------
				// 6. SUCCESS OUTPUT
				// ----------------------------
				item.json.status = 'posted';
				item.json.postedProduct = productName;
				item.json.contactUsed = contact;
				item.json.message = 'Requirement posted successfully';
			} catch (error) {
				if (this.continueOnFail()) {
					item.json.error = error;
				} else {
					throw error;
				}
			}
		}

		return [items];
	}
}