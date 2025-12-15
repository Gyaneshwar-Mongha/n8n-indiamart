# n8n-nodes-indiamart

This is an n8n community node for searching products on [IndiaMART](https://www.indiamart.com).

## Installation

1. Install this package:
```bash
npm install n8n-nodes-indiamart
```

2. Copy the node files to your n8n custom nodes directory:
```bash
cp -r dist/nodes/* ~/.n8n/custom/nodes/
```

## Usage

### IndiaMART Search Node

This node allows you to search for products on IndiaMART by keyword.

#### Input Parameters

- **Keyword** (required): The search keyword to query on IndiaMART
  - Example: "school bags", "shirts", "shoes"

#### Output

The node returns an object with the following properties:

- **products**: Array of product names matching the search
- **keyword**: The keyword used for the search

#### Example Workflow

```
[Trigger] → [IndiaMART Search] → [Process Results]
```

1. Set the Keyword parameter to your search term
2. The node fetches results from IndiaMART's search API
3. Returns a list of product names from the search results

#### Sample Output

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

## Features

- ✅ Search products by keyword
- ✅ Extract product names from results
- ✅ Error handling with proper n8n error reporting
- ✅ Supports multiple input items
- ✅ Continue on fail support

## Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Development Mode

```bash
npm run dev
```

This starts n8n with hot reload enabled for development.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Your Name (your.email@example.com)

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Support

For issues and questions, please create an issue on the GitHub repository.
