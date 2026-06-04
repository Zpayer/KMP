

const svgs = {
    "next": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
  <path d="M8.9101 20.6695C8.7201 20.6695 8.5301 20.5995 8.3801 20.4495C8.0901 20.1595 8.0901 19.6795 8.3801 19.3895L14.9001 12.8695C15.3801 12.3895 15.3801 11.6095 14.9001 11.1295L8.3801 4.60953C8.0901 4.31953 8.0901 3.83953 8.3801 3.54953C8.6701 3.25953 9.1501 3.25953 9.4401 3.54953L15.9601 10.0695C16.4701 10.5795 16.7601 11.2695 16.7601 11.9995C16.7601 12.7295 16.4801 13.4195 15.9601 13.9295L9.4401 20.4495C9.2901 20.5895 9.1001 20.6695 8.9101 20.6695Z" fill="white" style="fill: var(--fillg);"/>
</svg>`,
    "previous": `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<path d="M15 20.6695C14.81 20.6695 14.62 20.5995 14.47 20.4495L7.95003 13.9295C6.89003 12.8695 6.89003 11.1295 7.95003 10.0695L14.47 3.54953C14.76 3.25953 15.24 3.25953 15.53 3.54953C15.82 3.83953 15.82 4.31953 15.53 4.60953L9.01003 11.1295C8.53003 11.6095 8.53003 12.3895 9.01003 12.8695L15.53 19.3895C15.82 19.6795 15.82 20.1595 15.53 20.4495C15.38 20.5895 15.19 20.6695 15 20.6695Z" fill="white" style="fill: var(--fillg);"/>
</svg>
`,
    "gear": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
<g clip-path="url(#clip0_4418_7498)">
<path d="M12 15.75C9.93 15.75 8.25 14.07 8.25 12C8.25 9.93 9.93 8.25 12 8.25C14.07 8.25 15.75 9.93 15.75 12C15.75 14.07 14.07 15.75 12 15.75ZM12 9.75C10.76 9.75 9.75 10.76 9.75 12C9.75 13.24 10.76 14.25 12 14.25C13.24 14.25 14.25 13.24 14.25 12C14.25 10.76 13.24 9.75 12 9.75Z" fill="white" style="fill: var(--fillg);"/>
<path d="M15.21 22.1903C15 22.1903 14.79 22.1603 14.58 22.1103C13.96 21.9403 13.44 21.5503 13.11 21.0003L12.99 20.8003C12.4 19.7803 11.59 19.7803 11 20.8003L10.89 20.9903C10.56 21.5503 10.04 21.9503 9.42 22.1103C8.79 22.2803 8.14 22.1903 7.59 21.8603L5.87 20.8703C5.26 20.5203 4.82 19.9503 4.63 19.2603C4.45 18.5703 4.54 17.8603 4.89 17.2503C5.18 16.7403 5.26 16.2803 5.09 15.9903C4.92 15.7003 4.49 15.5303 3.9 15.5303C2.44 15.5303 1.25 14.3403 1.25 12.8803V11.1203C1.25 9.66029 2.44 8.47029 3.9 8.47029C4.49 8.47029 4.92 8.30029 5.09 8.01029C5.26 7.72029 5.19 7.26029 4.89 6.75029C4.54 6.14029 4.45 5.42029 4.63 4.74029C4.81 4.05029 5.25 3.48029 5.87 3.13029L7.6 2.14029C8.73 1.47029 10.22 1.86029 10.9 3.01029L11.02 3.21029C11.61 4.23029 12.42 4.23029 13.01 3.21029L13.12 3.02029C13.8 1.86029 15.29 1.47029 16.43 2.15029L18.15 3.14029C18.76 3.49029 19.2 4.06029 19.39 4.75029C19.57 5.44029 19.48 6.15029 19.13 6.76029C18.84 7.27029 18.76 7.73029 18.93 8.02029C19.1 8.31029 19.53 8.48029 20.12 8.48029C21.58 8.48029 22.77 9.67029 22.77 11.1303V12.8903C22.77 14.3503 21.58 15.5403 20.12 15.5403C19.53 15.5403 19.1 15.7103 18.93 16.0003C18.76 16.2903 18.83 16.7503 19.13 17.2603C19.48 17.8703 19.58 18.5903 19.39 19.2703C19.21 19.9603 18.77 20.5303 18.15 20.8803L16.42 21.8703C16.04 22.0803 15.63 22.1903 15.21 22.1903ZM12 18.4903C12.89 18.4903 13.72 19.0503 14.29 20.0403L14.4 20.2303C14.52 20.4403 14.72 20.5903 14.96 20.6503C15.2 20.7103 15.44 20.6803 15.64 20.5603L17.37 19.5603C17.63 19.4103 17.83 19.1603 17.91 18.8603C17.99 18.5603 17.95 18.2503 17.8 17.9903C17.23 17.0103 17.16 16.0003 17.6 15.2303C18.04 14.4603 18.95 14.0203 20.09 14.0203C20.73 14.0203 21.24 13.5103 21.24 12.8703V11.1103C21.24 10.4803 20.73 9.96029 20.09 9.96029C18.95 9.96029 18.04 9.52029 17.6 8.75029C17.16 7.98029 17.23 6.97029 17.8 5.99029C17.95 5.73029 17.99 5.42029 17.91 5.12029C17.83 4.82029 17.64 4.58029 17.38 4.42029L15.65 3.43029C15.22 3.17029 14.65 3.32029 14.39 3.76029L14.28 3.95029C13.71 4.94029 12.88 5.50029 11.99 5.50029C11.1 5.50029 10.27 4.94029 9.7 3.95029L9.59 3.75029C9.34 3.33029 8.78 3.18029 8.35 3.43029L6.62 4.43029C6.36 4.58029 6.16 4.83029 6.08 5.13029C6 5.43029 6.04 5.74029 6.19 6.00029C6.76 6.98029 6.83 7.99029 6.39 8.76029C5.95 9.53029 5.04 9.97029 3.9 9.97029C3.26 9.97029 2.75 10.4803 2.75 11.1203V12.8803C2.75 13.5103 3.26 14.0303 3.9 14.0303C5.04 14.0303 5.95 14.4703 6.39 15.2403C6.83 16.0103 6.76 17.0203 6.19 18.0003C6.04 18.2603 6 18.5703 6.08 18.8703C6.16 19.1703 6.35 19.4103 6.61 19.5703L8.34 20.5603C8.55 20.6903 8.8 20.7203 9.03 20.6603C9.27 20.6003 9.47 20.4403 9.6 20.2303L9.71 20.0403C10.28 19.0603 11.11 18.4903 12 18.4903Z" fill="white" style="fill: var(--fillg);"/>
</g>
<defs>
<clipPath id="clip0_4418_7498">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>
</svg>`
}



function createElement(parent, tagName, attributes = {}, children) {
    let e = document.createElement(tagName);
    if (attributes?.first_child) parent.prepend(e);
    if (parent) parent.appendChild(e);

    if (typeof attributes?.key === "string") e.key = attributes.key;

    Object.entries(attributes).forEach(([k, v]) => {
        if (k.slice(0, 5) === "event") {
            e.addEventListener(k.split("_")[1], (...args) => v(e, ...args))
        } else
            if (k.slice(0, 4) === "prop") {
                e[k.split("_")[1]] = v;
            } else switch (k) {
                case "class":
                    e.className = v;
                    break;
                case "html":
                    e.innerHTML = v;
                    break;
                case "text":
                    e.textContent = v;
                    break;
                case "style":
                    if (typeof v == "object") {
                        Object.entries(v).forEach(([k_, v_]) => e.style[k_] = v_);
                    } else if (typeof v == "string") e.style = v;
                    break;
                case "first_child": case "key":
                    break;
                default:
                    e.setAttribute(k, v);
            }
    });
    if (children) {
        if (typeof children === "object") {
            if (children instanceof Array) children.forEach(l => {
                if (l?.key) e[l.key] = l;
                e.appendChild(l);
            });
            else {
                if (children?.key) e[children.key] = children;
                e.appendChild(children);
            }
        } else {
            console.error("couldn't get element children");
        }
    }
    return e;
}


function AddSection(parent, style, children) {
    return createElement(parent, "div", {
        style: {
            background: 'rgba(255, 255, 255, 0)',
            width: '90%',
            borderRadius: '10px',
            display: 'flex',
            flexFlow: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'rgba(255, 255, 255, 0.72)',
            fontFamily: '"Open Sans", sans-serif',
            userSelect: 'none',
            ...style
        }
    }, children);
}

function AddSelect(parent, text, options, index, onchange, style) {
    let startIndex = index;
    const changeIndex = (val) => {
        if (startIndex + val > options.length - 1) startIndex = 0;
        else if (startIndex + val < 0) startIndex = options.length - 1;
        else startIndex += val;
        d.textContent = options[startIndex];
        onchange(options[startIndex], startIndex);
    }

    let d;

    return AddSection(parent, style, [
        createElement(null, "div", {
            text,
            style: {
                fontFamily: '"Open Sans", sans-serif',
                marginLeft: '10px',
            }
        }),
        createElement(null, "div", {
            style: {
                display: 'flex',
                gap: '10px',
                marginRight: '10px'
            }
        }, [
            createElement(null, "div", {
                html: svgs.previous,
                class: "transition",
                style: { display: 'flex', cursor: "pointer" },
                event_click: () => changeIndex(-1)
            }),
            d = createElement(null, "div", {
                text: options[index],
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    height: '24px'
                }
            }),
            createElement(null, "div", {
                html: svgs.next,
                class: "transition",
                style: { display: 'flex', cursor: "pointer" },
                event_click: () => changeIndex(1)
            }),
        ])
    ]);

}

function AddButton() {
    return createElement(parent, "button");
}

function AddTextInput(parent, text, value, onchange, style) {

    return AddSection(parent, style, [
        createElement(null, "div", {
            text,
            style: {
                fontFamily: '"Open Sans", sans-serif',
                marginLeft: '10px',
            }
        }),
        createElement(null, "input", {
            placeholder: "...",
            event_change: (e) => onchange(e.value),
            class: "transition",
            style: {
                display: 'flex',
                gap: '10px',
                marginRight: '10px',
                background: 'transparent',
                color: 'currentColor',
                fontFamily: '"Open Sans", sans-serif',
                border: '1px solid',
                padding: '1px',
                height: '20px',
                boxSizing: 'content-box',
                borderRadius: '3px',
                outline: 'none'
            },
            ...value ? { value } : {}
        }, [])
    ]);

}





window.UIHelper = {
    createElement,
    AddSection,
    AddSelect,
    AddButton,
    AddTextInput,
    svgs
}