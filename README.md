![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-indiamart

An n8n community node for searching products on [IndiaMART](https://www.indiamart.com). This node allows you to integrate IndiaMART product search functionality into your n8n workflows.

## Features

- 🔍 **Search Products** - Search for products on IndiaMART by keyword
- 📦 **Extract Product Names** - Automatically extracts product names from search results
- ⚡ **Easy Integration** - Simple keyword input, clean product list output
- 🔄 **Batch Processing** - Supports processing multiple search queries
- ❌ **Error Handling** - Robust error handling with continue on fail support
- 📋 **Multiple Items** - Process multiple items in a single workflow execution

## Installation

### Option 1: NPM Install (when published)

```bash
npm install n8n-nodes-indiamart
```

### Option 2: Local Development

1. Clone this repository:
```bash
git clone git@github.com:Gyaneshwar-Mongha/n8n-indiamart.git
cd n8n-nodes-indiamart
```

2. Install dependencies:
```bash
npm install
```

3. Build the node:
```bash
npm run build
```

4. Link to your n8n installation:
```bash
npm link
cd ~/.n8n/custom
npm link n8n-nodes-indiamart
```

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

### Example Workflow

#### Basic Product Search
```
[Trigger] → [IndiaMART Search] → [Log Output]
```

1. Add an IndiaMART Search node to your workflow
2. Set the Keyword parameter (e.g., "school bags")
3. Execute the workflow
4. View the product names in the output

#### Bulk Search with Loop
```
[HTTP Request: Get Keywords] → [Loop] → [IndiaMART Search] → [Save to Database]
```

1. Use HTTP Request to fetch a list of keywords
2. Loop over each keyword
3. Search IndiaMART for each keyword
4. Save results to your database

#### Search and Filter
```
[IndiaMART Search] → [Item Lists: Filter] → [Email]
```

1. Search for products
2. Filter results based on criteria
3. Email the filtered results

## Development

### Prerequisites

- **Node.js** (v22 or higher) and npm
- **git**

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

This starts n8n with hot reload enabled for development.

### Linting

```bash
npm run lint
npm run lint:fix
```

### Release

```bash
npm run release
```

## Node Structure

```
nodes/
  IndiaMArtSearch/
    IndiaMArtSearch.node.ts      # Main node implementation
    IndiaMArtSearch.node.json    # Node metadata
    imLogo.png                   # Node icon
```

## How It Works

1. **Accepts keyword input** from the user
2. **Makes HTTP request** to IndiaMART's search API endpoint
3. **Parses JSON response** from the API
4. **Extracts product names** from the `results[].fields.title` path
5. **Returns clean array** of product names

## API Details

- **Endpoint**: `https://m.indiamart.com/ajaxrequest/search/search`
- **Method**: GET
- **Parameters**: `s` (search keyword)
- **Response**: JSON with results array containing product information

## Troubleshooting

### Node Not Loading
- Ensure `npm run build` was executed
- Check that node is linked correctly with `npm link`
- Restart n8n after installation

### No Results Returned
- Verify the keyword is spelled correctly
- Try searching with a more common term
- Check your internet connection

### API Rate Limiting
- IndiaMART may rate-limit requests
- Consider adding delays between searches in workflows
- Use the "Continue on Fail" option to handle timeouts

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and commit them (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Support

For issues, questions, or feature requests, please:

1. Check the [Troubleshooting](#troubleshooting) section
2. Create an [issue on GitHub](https://github.com/gyaneshwar/n8n-nodes-indiamart/issues)
3. Check n8n's [documentation](https://docs.n8n.io/)

## Author

**Gyaneshwar Mongha**
- Email: gyaneshwar.mongha@indiamart.com
- GitHub: [@gyaneshwar](https://github.com/gyaneshwar)

## Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Node Development Guide](https://docs.n8n.io/integrations/creating-nodes/)
- [IndiaMART Website](https://www.indiamart.com)
- [Community Nodes on npm](https://www.npmjs.com/search?q=keywords:n8n-community-node-package)

### 4. Build Your Node

Edit the example nodes to fit your use case, or create new node files by copying the structure from [nodes/Example/](nodes/Example/).

> [!TIP]
> If you want to scaffold a completely new node package, use `npm create @n8n/node` to start fresh with the CLI's interactive generator.

### 5. Configure Your Package

Update `package.json` with your details:

- `name` - Your package name (must start with `n8n-nodes-`)
- `author` - Your name and email
- `repository` - Your repository URL
- `description` - What your node does

Make sure your node is registered in the `n8n.nodes` array.

### 6. Develop and Test Locally

Start n8n with your node loaded:

```bash
npm run dev
```

This command runs `n8n-node dev` which:

- Builds your node with watch mode
- Starts n8n with your node available
- Automatically rebuilds when you make changes
- Opens n8n in your browser (usually http://localhost:5678)

You can now test your node in n8n workflows!

> [!NOTE]
> Learn more about CLI commands in the [@n8n/node-cli documentation](https://www.npmjs.com/package/@n8n/node-cli).

### 7. Lint Your Code

Check for errors:

```bash
npm run lint
```

Auto-fix issues when possible:

```bash
npm run lint:fix
```

### 8. Build for Production

When ready to publish:

```bash
npm run build
```

This compiles your TypeScript code to the `dist/` folder.

### 9. Prepare for Publishing

Before publishing:

1. **Update documentation**: Replace this README with your node's documentation. Use [README_TEMPLATE.md](README_TEMPLATE.md) as a starting point.
2. **Update the LICENSE**: Add your details to the [LICENSE](LICENSE.md) file.
3. **Test thoroughly**: Ensure your node works in different scenarios.

### 10. Publish to npm

Publish your package to make it available to the n8n community:

```bash
npm publish
```

Learn more about [publishing to npm](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry).

### 11. Submit for Verification (Optional)

Get your node verified for n8n Cloud:

1. Ensure your node meets the [requirements](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/):
   - Uses MIT license ✅ (included in this starter)
   - No external package dependencies
   - Follows n8n's design guidelines
   - Passes quality and security review

2. Submit through the [n8n Creator Portal](https://creators.n8n.io/nodes)

**Benefits of verification:**

- Available directly in n8n Cloud
- Discoverable in the n8n nodes panel
- Verified badge for quality assurance
- Increased visibility in the n8n community

## Available Scripts

This starter includes several npm scripts to streamline development:

| Script                | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `npm run dev`         | Start n8n with your node and watch for changes (runs `n8n-node dev`) |
| `npm run build`       | Compile TypeScript to JavaScript for production (runs `n8n-node build`) |
| `npm run build:watch` | Build in watch mode (auto-rebuild on changes)                    |
| `npm run lint`        | Check your code for errors and style issues (runs `n8n-node lint`) |
| `npm run lint:fix`    | Automatically fix linting issues when possible (runs `n8n-node lint --fix`) |
| `npm run release`     | Create a new release (runs `n8n-node release`)                   |

> [!TIP]
> These scripts use the [@n8n/node-cli](https://www.npmjs.com/package/@n8n/node-cli) under the hood. You can also run CLI commands directly, e.g., `npx n8n-node dev`.

## Troubleshooting

### My node doesn't appear in n8n

1. Make sure you ran `npm install` to install dependencies
2. Check that your node is listed in `package.json` under `n8n.nodes`
3. Restart the dev server with `npm run dev`
4. Check the console for any error messages

### Linting errors

Run `npm run lint:fix` to automatically fix most common issues. For remaining errors, check the [n8n node development guidelines](https://docs.n8n.io/integrations/creating-nodes/).

### TypeScript errors

Make sure you're using Node.js v22 or higher and have run `npm install` to get all type definitions.

## Resources

- **[n8n Node Documentation](https://docs.n8n.io/integrations/creating-nodes/)** - Complete guide to building nodes
- **[n8n Community Forum](https://community.n8n.io/)** - Get help and share your nodes
- **[@n8n/node-cli Documentation](https://www.npmjs.com/package/@n8n/node-cli)** - CLI tool reference
- **[n8n Creator Portal](https://creators.n8n.io/nodes)** - Submit your node for verification
- **[Submit Community Nodes Guide](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/)** - Verification requirements and process

## Contributing

Have suggestions for improving this starter? [Open an issue](https://github.com/n8n-io/n8n-nodes-starter/issues) or submit a pull request!

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
