import React, { Component } from 'react';
import axios from 'axios'

class DaftCrawler extends Component {
  state = {
    ads: []
  }

  componentDidMount() {
    axios.get(process.env.HOST || 'http://localhost:3001/api')
      .then(res => this.setState({ ads: res.data }))
      .catch(console.log)
  }

  render() {
    console.log(this.props.location)
    return (
      <div className="DaftCrawler">
        <header className="DaftCrawler-header">
          <h1 className="DaftCrawler-title">Welcome to React</h1>
        </header>
        <div>
          {
            this.state.ads.map(ad => 
              <p>
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
