import React, { Component } from 'react';
import axios from 'axios'

const REGIONS = [
  'dublin-4',
  'dublin-6',
  'dublin-6w',
  'dublin-7',
  'dublin-8',
  'dublin-14',
  'sandyford',
  'rathmines',
  'ballsbridge'
];

class DaftCrawler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      concurrency: 10,
      ads: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleSubmit(event) {
    console.log(this.state);
    this.setState({ ads: [] });
    event.preventDefault();
    axios.get(`/api?concurrency=${this.state.concurrency}`, { timeout: 29500 })
      .then(res => this.setState({ ads: res.data }))
      .catch(console.log)
  }

  render() {
    return (
      <div className="DaftCrawler">
        <header className="DaftCrawler-header">
          <h1 className="DaftCrawler-title">Welcome to Daft Crawler</h1>
        </header>
        <form onSubmit={this.handleSubmit}>
          <label>
            Concurrency
            <input type="number" name="concurrency" min="1" max="20" value={this.state.concurrency} onChange={this.handleChange} />
          </label>
          <input type="submit" value="Go!" />
        </form>

        <div>
          {
            this.state.ads.map(ad => 
              <p key={ad.ad_url}>
              <a href={ad.ad_url}>
                <img src={ad.image} alt="fuck"/>
                {ad.address}
              </a>
              <br />PRICE PER ROOM: €{ad.price_per_room}    (total price: {ad.total_price})
              <br />BEDROOM QTY: {ad.bedrooms_qty}
              </p>
            )
          }
        </div>
      </div>
    );
  }
}

export default DaftCrawler;
