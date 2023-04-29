
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

function App({ state }) {
  return {
    type: 'div',
    props: {
      className: 'app',
      children: [
        {
          type: Header,
          props: {},
        },
        {
          type: 'h1',
          props: {
            className: 'title',
            children: [
              'Hello!',
            ]
          },
        },
        {
          type: Clock,
          props: { time: state.time },
        },
        {
          type: Lots,
          props: { lots: state.lots },
        },
      ],
    },
  }
}

function Header() {
  return {
    type: 'header',
    props: {
      className: 'header',
      children: [
        {
          type: Logo,
        },
      ]
    },
  }
}

function Logo() {
  return {
    type: 'img',
    props: {
      className: 'logo',
      src: 'logo.png',
    }
  }
}

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;
  return {
    type: 'div',
    props: {
      className: 'clock',
      children: [
        {
          type: 'span',
          props: {
            className: 'value',
            children: [
              time.toLocaleTimeString(),
            ]
          }
        },
        {
          type: 'span',
          props: {
            className: isDay ? 'icon day' : 'icon night'
          }
        },
      ]
    }
  }
}

function Loading() {
  return {
    type: 'div',
    props: {
      className: 'loading',
      children: [
        'Loading...',
      ],
    }
  }
}

function Lots({ lots }) {
  if (lots === null) {
    return {
      type: Loading,
      props: {}
    }
  }

  return {
    type: 'div',
    props: {
      className: 'lots',
      children: lots.map((lot) => ({
        type: Lot,
        props: { lot }
      }))
    }
  }
}

function Lot({ lot }) {
  return {
    type: 'article',
    key: lot.id,
    props: {
      className: 'lot',
      children: [
        {
          type: 'div',
          props: {
            className: 'price',
            children: [
              lot.price
            ]
          }
        },
        {
          type: 'h1',
          props: {
            children: [
              lot.name
            ]
          }
        },
        {
          type: 'p',
          props: {
            children: [
              lot.description
            ]
          }
        }
      ]
    }
  }
}

// ###########################
function renderView(state) {
  render(
    App({ state }),
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
