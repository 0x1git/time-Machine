import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f5f6fa;
    color: #2c3e50;
    line-height: 1.6;
  }

  #root {
    height: 100vh;
    overflow: hidden;
  }

  .App {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* Focus styles */
  *:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }

  /* Button reset */
  button {
    border: none;
    background: none;
    cursor: pointer;
    font-family: inherit;
  }

  /* Input reset */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  /* Link styles */
  a {
    color: inherit;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* Utility classes */
  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .text-center {
    text-align: center;
  }

  .font-medium {
    font-weight: 500;
  }

  .font-semibold {
    font-weight: 600;
  }

  .font-bold {
    font-weight: 700;
  }

  .text-sm {
    font-size: 14px;
  }

  .text-lg {
    font-size: 18px;
  }

  .text-xl {
    font-size: 20px;
  }

  .mb-2 {
    margin-bottom: 8px;
  }

  .mb-4 {
    margin-bottom: 16px;
  }

  .mr-2 {
    margin-right: 8px;
  }

  .ml-2 {
    margin-left: 8px;
  }

  .p-2 {
    padding: 8px;
  }

  .p-4 {
    padding: 16px;
  }

  .px-4 {
    padding-left: 16px;
    padding-right: 16px;
  }

  .py-2 {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  /* Card styles */
  .card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    overflow: hidden;
  }

  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e1e5e9;
    font-weight: 600;
  }

  .card-body {
    padding: 20px;
  }

  /* Form styles */
  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    color: #374151;
  }

  .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .form-input:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  .form-error {
    color: #e74c3c;
    font-size: 12px;
    margin-top: 4px;
  }

  /* Button styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
    border: none;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: #3498db;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #2980b9;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #5a6268;
  }

  .btn-success {
    background-color: #28a745;
    color: white;
  }

  .btn-success:hover:not(:disabled) {
    background-color: #218838;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #c82333;
  }

  .btn-outline {
    background-color: transparent;
    border: 1px solid #d1d5db;
    color: #374151;
  }

  .btn-outline:hover:not(:disabled) {
    background-color: #f9fafb;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn-lg {
    padding: 12px 20px;
    font-size: 16px;
  }

  /* Loading animation */
  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Toast container styles */
  .Toastify__toast-container {
    z-index: 9999;
  }

  /* Media queries */
  @media (max-width: 768px) {
    .card-body {
      padding: 16px;
    }
    
    .btn {
      padding: 8px 12px;
    }
  }
`;

export default GlobalStyles;
