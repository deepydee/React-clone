
const api = {
  get (url) {
    switch (url) {
      case '/lots':
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve([
              {
                id: 1,
                name: 'Apple',
                description: 'Apple description',
                price: 16,
              },
              {
                id: 2,
                name: 'Orange',
                description: 'Orange description',
                price: 41,
              },
            ]);

            reject(
              new Error("Unknown address")
            )
          }, 3000);
        });
        break;

      default:
        throw new Error('Unknown address')
    }
  }
};

const stream = {
  subscribe (channel, listener) {
    const match = /price-(\d+)/.exec(channel);

    if (match) {
      setInterval(() => {
        listener({
          id: parseInt(match[1]),
          price: Math.round((Math.random() * 10 + 30))
        })
      }, 1000);
    }
  }
};

// ###########################

let state = {
  time: new Date(),
  lots: null,
};

const VDom = {
  createElement: (type, props = {}, ...children) => {
    const key = 'key' in props
      ? props.key
      : null;

    if (children.length === 1) {
      props.children = children[0];
    } else {
      props.children = children;
    }

    return {
      type,
      key,
      props
    }
  }
}

function App({ state }) {
  return React.createElement(
    'div',
    { className: 'app' },
    React.createElement(Header),
    React.createElement('h1', { className: 'title' }, 'Hello!'),
    React.createElement(Clock, { time: state.time }),
    React.createElement(Lots, { lots: state.lots })
  );
}

function Header() {
  return React.createElement(
    'header',
    { className: 'header' },
    React.createElement(Logo)
  );
}

function Logo() {
  // return <img className="logo" src="logo.png" />
  return React.createElement('img', { className: 'logo', src: 'logo.png' })
}

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return React.createElement('div', { className: 'clock' },
    React.createElement('span', { className: 'value' }, time.toLocaleTimeString()),
    React.createElement('span', { className: isDay ? 'icon day' : 'icon night' })
  );
}

function Loading() {
  return React.createElement('div', { className: 'loading' }, 'Loading...');
}

function Lots({ lots }) {
  if (lots === null) {
    return React.createElement(Loading);
  }

  return React.createElement('div', { className: 'lots' },
    lots.map((lot) => React.createElement(Lot, { lot, key: lot.id }))
  );
}

function Lot({ lot, k }) {
  return React.createElement('article', { className: 'lot', k },
    React.createElement('div', { className: 'price' }, lot.price),
    React.createElement('h1', {}, lot.name),
    React.createElement('p', {}, lot.description)
  );
}

// ###########################
function renderView(state) {
  ReactDOM.render(
    React.createElement(App, { state }),
    document.getElementById('root'),
  );
}

renderView(state);


setInterval(() => {
  state = {
    ...state,
    time: new Date(),
  };

  renderView(state);

}, 1000);

api.get('/lots')
    //.finally(() => alert("Загрузка завершена"))

    .then((lots) => {
      state = {
        ...state,
        lots,
      };

      renderView(state);

      const onPrice = (data) => {
        state = {
          ...state,
          lots: state.lots.map((lot) => {
            if (lot.id === data.id) {
              return {
                ...lot,
                price: data.price,
              }
            }
            return lot;
          }),
        }
        renderView(state);
      };

      lots.forEach((lot) => {
        stream.subscribe(`price-${lot.id}`, onPrice);
      });

    })

    .catch((err) => console.log(err)
);

function render (virtualDom, realDomRoot) {
  const evaluatedVirtualDom = evaluate(virtualDom);

  const virtualDomRoot = {
    type: realDomRoot.tagName.toLowerCase(),
    props: {
      id: realDomRoot.id,
      ...realDomRoot.attributes,
      children: [
        evaluatedVirtualDom
      ]
    }
  }

  sync(virtualDomRoot, realDomRoot);
}

function evaluate(virtualNode) {
  if (typeof virtualNode !== 'object') {
    return virtualNode;
  }

  if (typeof virtualNode.type === 'function') {
    return evaluate((virtualNode.type)(virtualNode.props));
  }

  const props = virtualNode.props || {};

  return {
    ...virtualNode,
    props: {
      ...props,
      children: Array.isArray(props.children)
        ? props.children.map(evaluate)
        : [evaluate(props.children)]
    }
  }
}

function sync(virtualNode, realNode) {
  // sync element

  if (virtualNode.props) {
    Object.entries(virtualNode.props).forEach(([name, value]) => {
      if (name === 'children' && name === 'key') {
        return;
      }

      if (realNode[name] !== value) {
         realNode[name] = value
      }
    });
  }

  if (virtualNode.key) {
    realNode.dataset.key = virtualNode.key;
  }

  if (typeof virtualNode !== 'object' && virtualNode !== realNode.nodeValue) {
    realNode.nodeValue = virtualNode;
  }

  // sync child nodes
  const virtualChildren = virtualNode.props
    ? virtualNode.props.children || []
    : [];
  const realChildren = realNode.childNodes;

  for (let i = 0; i < virtualChildren.length || i < realChildren.length; i++) {
    const virtual = virtualChildren[i];
    const real = realChildren[i];

    // Remove
    if (!virtual && real) {
      realNode.remove(real);
    }

    // Update
    if (virtual && real && (virtual.type || '') === (real.tagName || '').toLowerCase()) {
      sync(virtual, real);
    }

    // Replace
    if (virtual && real && (virtual.type || '') !== (real.tagName || '').toLowerCase()) {
      const newReal = createRealNodeByVirtual(virtual);
      sync(virtual, newReal);
      real.replaceWith(newReal);
    }

    // Add
    if (virtual && !real) {
      const newReal = createRealNodeByVirtual(virtual);
      sync(virtual, newReal);
      realNode.append(newReal);
    }
  }
}

function createRealNodeByVirtual(virtual) {
  if (typeof virtual !== 'object') {
    return document.createTextNode('');
  }

  return document.createElement(virtual.type);
}
