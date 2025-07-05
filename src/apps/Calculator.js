export default class Calculator {
  constructor(os) {
    this.os = os;
    this.title = 'Calculator';
    this.icon = '/assets/icons/calculator.png';
    this.window = null;
    this.currentInput = '0';
    this.previousInput = null;
    this.operation = null;
    this.resetInput = false;
  }
  
  launch() {
    this.window = this.os.services.window.createWindow({
      title: this.title,
      icon: this.icon,
      width: 300,
      height: 400,
      content: this.render()
    });
    
    // Add to taskbar
    this.os.components.taskbar.addTaskbarItem(this.window);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  render() {
    return `
      <div class="calculator h-full flex flex-col bg-gray-800">
        <div class="display bg-gray-900 p-4 text-right">
          <div class="previous-operand text-gray-400 text-sm h-5 overflow-hidden">
            ${this.previousInput || ''} ${this.operation || ''}
          </div>
          <div class="current-operand text-white text-3xl font-medium mt-2 overflow-hidden">
            ${this.currentInput}
          </div>
        </div>
        
        <div class="buttons grid grid-cols-4 gap-1 p-2 flex-1">
          <button class="function bg-gray-700 hover:bg-gray-600 text-white rounded p-2" data-value="AC">AC</button>
          <button class="function bg-gray-700 hover:bg-gray-600 text-white rounded p-2" data-value="+/-">+/-</button>
          <button class="function bg-gray-700 hover:bg-gray-600 text-white rounded p-2" data-value="%">%</button>
          <button class="operation bg-blue-600 hover:bg-blue-500 text-white rounded p-2" data-value="/">/</button>
          
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value="7">7</button>
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value="8">8</button>
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value="9">9</button>
          <button class="operation bg-blue-600 hover:bg-blue-500 text-white rounded p-2" data-value="*">×</button>
          
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value="4">4</button>
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value="5">5</button>
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value="6">6</button>
          <button class="operation bg-blue-600 hover:bg-blue-500 text-white rounded p-2" data-value="-">-</button>
          
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value="1">1</button>
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value="2">2</button>
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value="3">3</button>
          <button class="operation bg-blue-600 hover:bg-blue-500 text-white rounded p-2" data-value="+">+</button>
          
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2 col-span-2" data-value="0">0</button>
          <button class="number bg-gray-600 hover:bg-gray-500 text-white rounded p-2" data-value=".">.</button>
          <button class="operation bg-blue-600 hover:bg-blue-500 text-white rounded p-2" data-value="=">=</button>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    const buttons = this.window.element.querySelectorAll('button');
    
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.value;
        
        if (button.classList.contains('number')) {
          this.appendNumber(value);
        } else if (button.classList.contains('operation')) {
          this.chooseOperation(value);
        } else if (button.classList.contains('function')) {
          this.executeFunction(value);
        }
        
        this.updateDisplay();
      });
    });
  }
  
  appendNumber(number) {
    if (this.currentInput === '0' || this.resetInput) {
      this.currentInput = number;
      this.resetInput = false;
    } else {
      this.currentInput += number;
    }
  }
  
  chooseOperation(operation) {
    if (operation === '=') {
      this.compute();
      return;
    }
    
    if (this.currentInput === '') return;
    
    if (this.previousInput !== null) {
      this.compute();
    }
    
    this.operation = operation;
    this.previousInput = this.currentInput;
    this.resetInput = true;
  }
  
  executeFunction(func) {
    switch (func) {
      case 'AC':
        this.clear();
        break;
      case '+/-':
        this.currentInput = (parseFloat(this.currentInput) * -1).toString();
        break;
      case '%':
        this.currentInput = (parseFloat(this.currentInput) / 100).toString();
        break;
    }
  }
  
  compute() {
    let computation;
    const prev = parseFloat(this.previousInput);
    const current = parseFloat(this.currentInput);
    
    if (isNaN(prev)) return;
    
    switch (this.operation) {
      case '+':
        computation = prev + current;
        break;
      case '-':
        computation = prev - current;
        break;
      case '*':
        computation = prev * current;
        break;
      case '/':
        computation = prev / current;
        break;
      default:
        return;
    }
    
    this.currentInput = computation.toString();
    this.operation = null;
    this.previousInput = null;
    this.resetInput = true;
  }
  
  clear() {
    this.currentInput = '0';
    this.previousInput = null;
    this.operation = null;
  }
  
  updateDisplay() {
    const currentOperand = this.window.element.querySelector('.current-operand');
    const previousOperand = this.window.element.querySelector('.previous-operand');
    
    currentOperand.textContent = this.currentInput;
    
    if (this.operation) {
      previousOperand.textContent = `${this.previousInput || ''} ${this.operation}`;
    } else {
      previousOperand.textContent = '';
    }
  }
}