class ViewPanel {

	public static currentPanel: ViewPanel | undefined;
	public static readonly viewType = 'ReactION';
	private readonly _htmlPanel: vscode.WebviewPanel;
	private readonly _treePanel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionPath: string) {
		const treeColumn = vscode.ViewColumn.Three;
		const htmlColumn = vscode.ViewColumn.Two;
		if (ViewPanel.currentPanel) {
			ViewPanel.currentPanel._htmlPanel.reveal(htmlColumn);
			ViewPanel.currentPanel._treePanel.reveal(treeColumn);
			return;
		}

		// Show HTML Preview in VS Code
		const htmlPanel = vscode.window.createWebviewPanel(ViewPanel.viewType, "HTML Preview", htmlColumn, {

			// Enable javascript in the webview
			enableScripts: true,
			retainContextWhenHidden: true,
			enableCommandUris: true
		});

		// Show Virtual DOM Tree in VS Code
		const treePanel = vscode.window.createWebviewPanel(ViewPanel.viewType, "Virtual DOM Tree", treeColumn, {

			// Enable javascript in the webview
			enableScripts: true,
			retainContextWhenHidden: true,
			enableCommandUris: true
		});

		ViewPanel.currentPanel = new ViewPanel(htmlPanel, panel, extensionPath);
	}

	// Reload previous webview panel state
	public static revive(htmlPanel: vscode.WebviewPanel, panel: vscode.WebviewPanel, extensionPath: string) {
		ViewPanel.currentPanel = new ViewPanel(htmlPanel, panel, extensionPath);
	}

	// Constructor for tree view and html panel
	private constructor(
		htmlPanel: vscode.WebviewPanel,
		treePanel: vscode.WebviewPanel,
		extensionPath: string
	) {
		this._htmlPanel = htmlPanel;
		this._treePanel = treePanel;
		this._extensionPath = extensionPath;
		this._html = '';
		this.reactData = '';
		this._update();
		this._treePanel.onDidDispose(() => this.dispose(), null, this._disposables);
		this._treePanel.onDidChangeViewState(e => {
			if (this._treePanel.visible) {
				/************************************
					***Are we using this if statement?***
					*************************************/
			}
		}, null, this._disposables);

		// Handle messages from the webview
		this._treePanel.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'alert':
					vscode.window.showErrorMessage(message.text);
					return;
			}
		}, null, this._disposables);

		this._treePanel.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'notice':
					vscode.window.showErrorMessage(message.text);
					return;
			}
		}, null, this._disposables);

	}

	public dispose() {
		ViewPanel.currentPanel = undefined;

		// Clean up our resources
		this._htmlPanel.dispose();
		this._treePanel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async _update() {
		this._htmlPanel.webview.html = this._getPreviewHtmlForWebview();
		const rawReact = await this._runPuppeteer();
		this._treePanel.webview.html = this._getHtmlForWebview(rawReact);
	}

	// Putting scraped meta-data to D3 tree diagram
	private _getHtmlForWebview(rawTreeData: any) {

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();
		const flatData = JSON.stringify(rawTreeData);

		return treeView.generateD3(flatData);
	}

	private _getPreviewHtmlForWebview() {
		return htmlView.html;
	}
}
