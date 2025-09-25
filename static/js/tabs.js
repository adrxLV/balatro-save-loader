function handleTabClose({ tab, dataDiv, ctx }) {
    if (tab) {
        tab.save?.({
            dataDiv,
            ...ctx,
        });
    }
    dataDiv.innerHTML = '';
}

function renderTabs(tabData, ctx, buttonDiv, dataDiv) {
    const loaded = {
        tab: null,
        canClose: true,
    };
    let buttons;
    let returnData = {
        saveCurrent: () => {
            loaded.tab.save?.({
                dataDiv,
                ...ctx,
            });
        }
    };

    const setCanClose = (canClose) => {
        loaded.canClose = canClose;
        buttons.forEach((button) => {
            button.disabled = !canClose;
        });
        returnData?.setCanClose?.(canClose);
    };

    const setActiveTab = (activeButton) => {
        buttons.forEach((button) => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    };

    buttons = tabData.map((tab) => {
        if (!(tab.shouldShow?.(ctx) ?? true)) {
            return null;
        }
        const button = document.createElement('button');
        button.textContent = tab.name;
        button.setAttribute('role', 'tab');
        button.addEventListener('click', () => {
            if (loaded.tab && !loaded.canClose && !tab.canClose?.(ctx)) {
                return;
            }
            handleTabClose({ tab: loaded.tab, dataDiv, ctx });
            tab.render?.({ ...ctx, dataDiv, setCanClose });
            loaded.tab = tab;
            setActiveTab(button);
        });
        return button;
    }).filter((button) => button !== null);
    
    buttonDiv.innerHTML = '';
    buttons.forEach((button) => buttonDiv.appendChild(button));
    
    if (buttons.length > 0) {
        buttons[0].click();
    }

    return returnData;
}

export {
    renderTabs,
    handleTabClose,
}