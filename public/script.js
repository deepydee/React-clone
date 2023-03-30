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
      }, 400);
    }
  }
};

// ###########################

let state = {
  time: new Date(),
  lots: null,
};

function App({ state }) {
  const app = document.createElement('div');
  app.className = 'app';

  app.append(Header());
  app.append(Clock({
    time: state.time,
  }));
  app.append(Lots({ lots: state.lots }));

  return app;
}

function Header() {
  const header = document.createElement('header');
  header.className = 'header';
  //header.append(Logo());

  return header;
}

function Logo() {
  const logo = document.createElement('img');
  logo.className = 'logo';
  logo.src = 'logo.png';

  return logo;
}

function Clock({ time }) {
  const node = document.createElement('div');
  node.className = 'clock';

  const value = document.createElement('span');
  value.className = 'value';
  value.innerText = time.toLocaleTimeString();

  node.append(value);

  const icon = document.createElement('span');

  if (time.getHours() >= 7 && time.getHours() <= 21) {
    icon.className = 'icon day';
  } else {
    icon.className = 'icon night';
  }

  node.append(icon);

  return node;
}

function Loading() {
  const node = document.createElement('div');
  node.className = 'loading';
  node.innerText = 'Loading...';

  return node;
}

function Lots({ lots }) {
  if (lots === null) {
    return Loading();
  }

  const node = document.createElement('div');
  node.className = 'lots';

  lots.forEach((lot) => {
    node.append(Lot({ lot }));
  });

  return node;
}

function Lot({ lot }) {
  const node = document.createElement('article');
  node.className = 'lot';

  const price = document.createElement('div');
  price.className = 'price';
  price.innerText = lot.price;
  node.append(price);

  const name = document.createElement('h1');
  name.innerText = lot.name;
  node.append(name);

  const description = document.createElement('p');
  description.innerText = lot.description;
  node.append(description);

  return node;
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

function render (newDom, realDom) {
  realDom.innerHTML = '';
  realDom.append(newDom);
}
