import { get, set } from "./saveLogic.js";

const rawTab = {
    name: 'Raw',
    render: (ctx) => {
        const textarea = document.createElement('textarea');
        textarea.value = JSON.stringify(ctx.data, null, 4);
        textarea.addEventListener('change', () => {
            validateRaw(textarea, ctx.setCanClose);
        });
        textarea.addEventListener('input', () => {
            validateRaw(textarea, ctx.setCanClose);
        });
        ctx.dataDiv.appendChild(textarea);
        ctx.setCanClose(true);
    },
    save: (ctx) => {
        try {
            const raw = JSON.parse(ctx.dataDiv.querySelector('textarea')?.value);
            if (raw) {
                // If I set this directly, it will not update the data elsewhere
                Object.assign(ctx.data, raw);
                Object.keys(ctx.data).forEach((key) => {
                    if (!raw.hasOwnProperty(key)) {
                        delete ctx.data[key];
                    }
                });
            }
        } catch (e) {
            console.error(e);
            ctx.dataDiv.innerText = 'Error processing raw data: ' + e.message;
        }
    }
};

function makeValuesTab(values) {
    return {
        name: 'Values',
        render: (ctx) => {
            try {
                const { dataDiv, data, setCanClose } = ctx;
                
                // Create a form container for better styling
                const formContainer = document.createElement('div');
                formContainer.className = 'form-container';
                
                values.forEach((value) => {
                    // Create form group for each field
                    const formGroup = document.createElement('div');
                    formGroup.className = 'form-group';
                    
                    const label = document.createElement('label');
                    label.textContent = value.name;
                    label.className = 'form-label';
                    
                    if (value.type !== 'label') {
                        const inputWrapper = document.createElement('div');
                        inputWrapper.className = 'input-wrapper';
                        
                        const input = document.createElement('input');
                        input.type = value.type;
                        input.className = 'form-control';
                        
                        if (value.type === 'checkbox') {
                            input.checked = get(data, value.path) ?? value.default;
                            input.className = 'form-checkbox';
                            
                            // For checkboxes, create a special layout
                            const checkboxWrapper = document.createElement('div');
                            checkboxWrapper.className = 'checkbox-wrapper';
                            checkboxWrapper.appendChild(input);
                            checkboxWrapper.appendChild(label);
                            formGroup.appendChild(checkboxWrapper);
                        } else {
                            input.value = get(data, value.path) ?? value.default ?? '';
                            if(value.type === 'number') {
                                input.step = value.step ?? 'any';
                            }
                            input.placeholder = `Enter ${value.name.toLowerCase()}...`;
                            
                            formGroup.appendChild(label);
                            inputWrapper.appendChild(input);
                            formGroup.appendChild(inputWrapper);
                        }
                        
                        input.name = value.path;
                        input.addEventListener('change', () => {
                            validateInputs({ target: input });
                            if (input.reportValidity()) {
                                setCanClose(true);
                                saveFormInput(input, value.type, value.path, data);
                            } else {
                                setCanClose(false);
                            }
                        });
                        input.addEventListener('input', () => {
                            validateInputs({ target: input });
                            if (input.reportValidity()) {
                                setCanClose(true);
                                saveFormInput(input, value.type, value.path, data);
                            } else {
                                setCanClose(false);
                            }
                        });
                    } else {
                        // For label-only items
                        label.className = 'form-label-only';
                        formGroup.appendChild(label);
                    }
                    
                    formContainer.appendChild(formGroup);
                });
                
                dataDiv.appendChild(formContainer);
            } catch (e) {
                console.error(e);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.innerHTML = `
                    <h3>❌ Error processing save data</h3>
                    <p><strong>Error:</strong> ${e.message}</p>
                    <p>Please make sure the save file is valid.</p>
                `;
                ctx.dataDiv.appendChild(errorDiv);
            }
        },
        save: (ctx) => {
            values.forEach((value) => {
                if(value.type === 'label') return;
                const input = ctx.dataDiv.querySelector(`input[name="${value.path}"]`);
                if (!input) return;
                if (input.value === '' && input.type !== 'checkbox') {
                    return;
                }
                saveFormInput(input, value.type, value.path, ctx.data);
            });
        }
    }
}


function validateInputs(e) {
    const input = e.target;
    switch (input.type) {
        case 'number':
            const number = Number(input.value);
            if (input.value === '') {
                input.setCustomValidity('Please enter a valid number');
            } else if (isNaN(number)) {
                input.setCustomValidity('Please enter a valid number');
            } else {
                input.setCustomValidity('');
            }
            break;
    }
    input.reportValidity();
}

function validateRaw(area, setCanClose) {
    try {
        JSON.parse(area.value);
        area.setCustomValidity('');
        setCanClose(true);
    } catch (e) {
        area.setCustomValidity('Invalid JSON:\n' + e.message);
        setCanClose(false);
    }
    area.reportValidity();
}

function saveFormInput(input, type, path, data) {
    switch (type) {
        case 'number':
            const number = Number(input.value);
            if (isNaN(number)) {
                return;
            }
            set(data, path, number);
            break;
        case 'checkbox':
            set(data, path, input.checked);
            break;
        default:
            set(data, path, input.value);
            break;
    }
}

export {
    rawTab,
    makeValuesTab,
}