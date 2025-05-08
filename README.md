# Conventional Comments - by Pullpo

<p align="center">
  <img src="icons/icon128.png" alt="Conventional Comments Logo" width="128" height="128">
</p>

> A browser extension that enhances code reviews by implementing the Conventional Comments standard directly in GitHub's interface.

<p align="center">
  <img src="media/demo.gif" alt="Conventional Comments Demo">
</p>

## 🎯 The Problem

Code reviews are crucial for maintaining code quality, but they often suffer from:
- Ambiguous or unclear feedback
- Misunderstandings about comment severity
- Difficulty in parsing and tracking different types of feedback
- Inconsistent commenting styles across team members

## 💡 The Solution

*Conventional Comments - by Pullpo* brings the power of [Conventional Comments](https://conventionalcomments.org/) directly into your GitHub workflow. It adds a sleek, intuitive toolbar to every comment box in GitHub, making it easy to:

- Add standardized labels to your comments (praise, suggestion, issue, etc.)
- Include decorators for additional context (non-blocking, blocking, if-minor)
- Maintain consistent formatting across all review comments
- Toggle between plain text and badge-style formatting

## ✨ Features

- 🎨 **Intuitive Toolbar**: Seamlessly integrated into GitHub's interface
- 🏷️ **Standard Labels**: 
  - `praise`: Highlight something positive
  - `nitpick`: Minor, non-blocking issues
  - `suggestion`: Suggest specific improvements
  - `issue`: Point out blocking problems
  - `question`: Ask for clarification
  - `thought`: Share a reflection or idea
  - `chore`: Request minor, non-code tasks
- 🎯 **Decorations**:
  - `(non-blocking)`: Optional changes
  - `(blocking)`: Must be addressed
  - `(if-minor)`: Address if the effort is small
- 🔄 **Toggle Functionality**: Easily remove labels or decorations
- 🎨 **Badge Style Option**: Switch between text and visual badge formats
- 🌓 **Dark Mode Support**: Seamlessly works with GitHub's themes

## 📥 Installation

### Chrome
1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/gelgbjildgbbfgfgpibgcnolcipinmlp?utm_source=github_readme)
2. Click "Add to Chrome"
3. The extension will automatically activate on GitHub.com

### Firefox
1. Visit the [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/conventional-comments-pullpo/)
2. Click "Add to Firefox"
3. The extension will automatically activate on GitHub.com

## 🚀 Usage

1. Navigate to any GitHub pull request or issue
2. Click on the comment box
3. Use the toolbar that appears above the comment box:
   - Select a label type (e.g., "suggestion", "issue")
   - Optionally add a decoration
   - Write your comment
4. Your comment will be automatically formatted according to the Conventional Comments standard

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🛠️ Building from Source

The extension can be built for both Chrome and Firefox using our build system:

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/pullpo/conventional-comments-helper.git
   cd conventional-comments-helper
   npm install
   ```

2. Build for your target browser:
   - For Chrome:
     ```bash
     npm run build:chrome
     ```
   - For Firefox:
     ```bash
     npm run build:firefox
     ```
   - For both browsers:
     ```bash
     npm run build
     ```

3. Load the extension:
   - Chrome: Load the `build/chrome` directory as an unpacked extension
   - Firefox: Load the `build/firefox` directory as a temporary add-on


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [conventionalcomments.org](https://conventionalcomments.org/)
- Built with love for the open source community
