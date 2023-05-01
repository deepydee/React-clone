mocha.setup('bdd');
const assert = chai.assert;

describe('Clock', () => {
  it('Render time of day', () => {
    const container = document.createElement('div');

    ReactDOM.render(
      <Clock time={new Date('2020-10-19T14:12:31')} />,
      container
    );

    const clock = container.querySelector('.clock');

    assert.equal(clock.querySelector('.value').innerText, '2:12:31 PM');
    assert.equal(clock.querySelector('.icon').className, 'icon day');
  });

  it('Render time of night', () => {
    const container = document.createElement('div');

    ReactDOM.render(
      <Clock time={new Date('2020-10-19T03:12:31')} />,
      container
    );

    const clock = container.querySelector('.clock');

    assert.equal(clock.querySelector('.value').innerText, '3:12:31 AM');
    assert.equal(clock.querySelector('.icon').className, 'icon night');
  });
});

mocha.run();
