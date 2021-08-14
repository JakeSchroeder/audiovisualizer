let template = `
    <h1>Hello World</h1>
`;

let render = function (template: string, node: HTMLElement) {
    if (!node) return;
    node.innerHTML = template;
};

export { render };
