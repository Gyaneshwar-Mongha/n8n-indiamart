![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-indiamart

This is an n8n community node. It lets you use IndiaMART in your n8n workflows.

IndiaMART is India's largest B2B marketplace, connecting buyers and suppliers across industries. This node allows you to search for products and integrate them directly into your automation workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node supports the following operations:

### Search
- **Search Products** - Search for products on IndiaMART by keyword and retrieve a list of matching product names

## Compatibility

Tested locally against n8n v1.104.2.

## Usage

### Node Configuration

The IndiaMART Search node requires a single parameter:

**Keyword** (required)
- The search term to query on IndiaMART
- Examples: "school bags", "office supplies", "women's clothing"

### Output

The node returns an object with:

```json
{
  "products": [
    "School Bags",
    "Kids School Bag",
    "Leather School Bags",
    "College Bag",
    "Polyester School Bag"
  ],
  "keyword": "school bags"
}
```

- **products**: Array of product names found
- **keyword**: The search keyword used

### Using the IndiaMART Node

Once installed:

1. **Create a new workflow** or open an existing one
2. **Add the IndiaMART Search node**: Search for "IndiaMART" in the node panel and drag it into your workflow
3. **Configure parameters**: Enter your search keyword (e.g., "school bags")
4. **Execute the workflow**: Test your workflow to retrieve product results
5. **Use the output**: Connect to other nodes to process, filter, or store the results

### Example Workflow

#### Basic Product Search
```
[Trigger] → [IndiaMART Search] → [Log Output]
```

1. Add an IndiaMART Search node to your workflow
2. Set the Keyword parameter (e.g., "school bags")
3. Execute the workflow
4. View the product names in the output

## Author

**Gyaneshwar Mongha**
- Email: gyaneshwar.mongha@indiamart.com
- GitHub: [@gyaneshwar](https://github.com/gyaneshwar)

## Resources

* [n8n Documentation](https://docs.n8n.io/)
* [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
* [IndiaMART Website](https://www.indiamart.com)
* [Community Nodes on npm](https://www.npmjs.com/search?q=keywords:n8n-community-node-package)
