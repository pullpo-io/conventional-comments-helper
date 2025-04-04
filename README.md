# Conventional Comments Helper

<p align="center">
  <img src="assets/icon128.png" alt="Conventional Comments Helper Logo" width="128" height="128">
</p>

> A Chrome extension that enhances code reviews by implementing the Conventional Comments standard directly in GitHub's interface.

## 🎯 The Problem

Code reviews are crucial for maintaining code quality, but they often suffer from:
- Ambiguous or unclear feedback
- Misunderstandings about comment severity
- Difficulty in parsing and tracking different types of feedback
- Inconsistent commenting styles across team members

## 💡 The Solution

Conventional Comments Helper brings the power of [Conventional Comments](https://conventionalcomments.org/) directly into your GitHub workflow. It adds a sleek, intuitive toolbar to every comment box in GitHub, making it easy to:

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

1. Visit the [Chrome Web Store](your-chrome-store-link)
2. Click "Add to Chrome"
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [conventionalcomments.org](https://conventionalcomments.org/)
- Built with love for the open source community