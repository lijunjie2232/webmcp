# GitHub Actions Workflows

## Deploy Documentation to GitHub Pages

This workflow automatically builds and deploys the WebMCP documentation to GitHub Pages.

### Trigger

The workflow is triggered when:
- Code is pushed to `main` or `master` branch
- Changes are made to files in the `docs/` directory
- Changes are made to the workflow file itself
- Manually triggered via the GitHub Actions UI

### What It Does

1. Checks out the repository
2. Sets up Python 3.11
3. Installs mkdocs, mkdocs-material, and mkdocs-static-i18n
4. Builds the documentation site
5. Deploys to GitHub Pages

### Output

The documentation will be available at:
```
https://<username>.github.io/webmcp/
```

Or if using a custom domain, it will be configured accordingly.

### Manual Deployment

You can manually trigger the deployment:
1. Go to the **Actions** tab in your GitHub repository
2. Select **Deploy Documentation to GitHub Pages**
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

### Configuration

To enable GitHub Pages:
1. Go to your repository **Settings**
2. Navigate to **Pages**
3. Under **Source**, select **GitHub Actions**
4. The workflow will handle the rest

### Environment Variables

No additional environment variables are required. The workflow uses default GitHub Actions permissions.

### Troubleshooting

If the deployment fails:
1. Check the Actions tab for error logs
2. Ensure all dependencies are correctly specified
3. Verify that the `docs/mkdocs.yml` configuration is valid
4. Make sure the build output is in `docs/site/`

### Customization

To customize the deployment:
- Edit `.github/workflows/deploy-docs.yml`
- Modify `docs/mkdocs.yml` for site configuration
- Add custom domain in repository Settings > Pages