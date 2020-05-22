import React, { Component } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import SelectField from './SelectField';
import Select from './Select';
import Button from './Button';
import Message from './Message';
import * as actions from '../../actions';
import ButtonGroup from './ButtonGroup';
import { MESSAGE_PROP_TYPE, ORDER_PROP_TYPE } from '../../constants/PropTypes';

const case_type_url = 'https://foreman.lot18.blackfire.pro/script/metafield_updatetype?auth=EiHLaEELflWq5XYb6jhgbIfrO1rKIoFk:d454448eff91a41ff21ee93438ba9ce69761a6b2b604fe78e7299e2f7491b127'
const case_size_url = 'https://foreman.lot18.blackfire.pro/script/metafield_updatesize?auth=EiHLaEELflWq5XYb6jhgbIfrO1rKIoFk:d454448eff91a41ff21ee93438ba9ce69761a6b2b604fe78e7299e2f7491b127'
let shopName;
console.log(window.location.hostname);
switch (window.location.hostname) {
  case 'tastingroom.com':
    shopName = 'testingroom.myshopify.com';
    break;
  case 'nytwineclub.com':
    shopName = 'nytwineclub.myshopify.com';
    break;
  case 'williams-sonomawine.com':
    shopName = 'williams-sonomawine.myshopify.com';
}

class CasePreferencesBlock extends Component {
  constructor(props) {
    super(props);

    this.enableEditing = this.enableEditing.bind(this);
    this.disableEditing = this.disableEditing.bind(this);
    // this.getSizeOptions = this.getSizeOptions.bind(this);
    // this.getIntervalOptions = this.getIntervalOptions.bind(this);
    this.caseSizeChange = this.caseSizeChange.bind(this);
    this.caseTypeChange = this.caseTypeChange.bind(this);
    this.saveCasePreferences = this.saveCasePreferences.bind(this);
    this.caseTypeLabel = this.caseTypeLabel.bind(this);

    this.state = {
      editing: false,
      selectedSize: 0,
      selectedType: 0,
      sizeMetafieldID: 0,
      typeMetafieldID: 0,
      updatingCasePreferences: false,
      updateCasePreferencesButtonDisabled: true,
    };
  }

  componentDidMount() {
    this.getData();
  }

  getData() {
    const shopifyCustomerId = this.props.order.shopify_customer_id;
    axios.get(`https://tastingroom.com/admin/api/2019-10/customers/${shopifyCustomerId}/metafields.json`, {
      headers: {
        'X-Shopify-Access-Token': 'b3a13411c43e3f26aa89b5db24996c55',
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(
        (result) => {
          const selectedSize = result.metafields.find(({ key }) => key === 'caseSize').value;
          const sizeMetafieldID = result.metafields.find(({ key }) => key === 'caseSize').id;
          const selectedType = result.metafields.find(({ key }) => key === 'caseType').value;
          const typeMetafieldID = result.metafields.find(({ key }) => key === 'caseType').id;
          this.setState({
            selectedSize,
            selectedType,
            sizeMetafieldID,
            typeMetafieldID,
          });
        },
      );
  }

  caseSizeChange(e) {
    this.setState({
      selectedSize: e.target.value,
      updateCasePreferencesButtonDisabled: false,
    });
  }

  caseTypeChange(e) {
    this.setState({
      selectedType: e.target.value,
      updateCasePreferencesButtonDisabled: false,
    });
  }

  disableEditing() {
    this.setState({
      editing: false,
    });
  }

  enableEditing() {
    this.dismissMessage();
    this.setState({
      editing: true,
    });
  }

  async saveCasePreferences(e) {
    const inputData = new FormData(this.formElement);

    const formInformation = {
      size: inputData.get('size').toString(),
      type: inputData.get('type').toString(),
    };

    e.preventDefault();
    this.setState({
      updateCasePreferencesButtonDisabled: true,
      updatingCasePreferences: true,
    });

    const sizeRes = await axios({
      url: `${case_size_url}&id=${this.props.order.shopify_customer_id}&cust_caseSize=${formInformation.size}&shopdomain=${shopName}`,
      method: 'POST',
      contentType: "application/x-www-form-urlencoded",
      dataType: 'json',
    });

    const typeRes = await axios({
      url: `${case_type_url}&id=${this.props.order.shopify_customer_id}&cust_caseType=${formInformation.type}&shopdomain=${shopName}`,
      method: 'POST',
      contentType: "application/x-www-form-urlencoded",
      dataType: 'json',
    });

    console.log('Saving Preferences');
    Promise.all([sizeRes,typeRes]).then((values) => {
      const selectedType = values[0].data.metafield.value;
      const typeMetafieldID = values[0].data.metafield.id;
      const selectedSize = values[1].data.metafield.value;
      const sizeMetafieldID = values[1].data.metafield.id;
      this.setState({
        selectedType,
        typeMetafieldID,
        selectedSize,
        sizeMetafieldID,
      });
      this.refreshCase();
    }).catch(err => {
      this.setState({
        selectedType: formInformation.type,
        selectedSize: formInformation.size,
      });
      console.log('cors err', err);
      this.refreshCase();
    });
    console.log('Preferences Saved!')
  }

  async refreshCase() {
    const shopifyCustomerId = this.props.order.shopify_customer_id;
    const subscriptionId = this.props.order.id;
    const shop = 'testingroom18.myshopify.com';
    const body = {
      customer_id: shopifyCustomerId,
      subscription_id: subscriptionId,
      shop,
    };
    try {
      const res = await axios({
        method: 'post',
        url: 'https://lot18.j.blackfire.pro/map/lot18_refresh_subscription?auth=5OzgzAAX4dPQ9Uyed3n8FtVJd1WevhwP:640a3bb0df3e96afc1a5a50aab36ddca553b67ecef02bb8652ba0da0442c337d',
        params: body,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(res);
      await this.props.appInitializeData();
      this.disableEditing();
      this.setState({
        updateCasePreferencesButtonDisabled: false,
        updatingCasePreferences: false,
      });
    } catch (e) {
      console.log(e);
      await this.props.appInitializeData();
      this.disableEditing();
      this.setState({
        updateCasePreferencesButtonDisabled: false,
        updatingCasePreferences: false,
      });
    }
  }

  dismissMessage() {
    const { order } = this.props;
    this.props.dismissFrequencyIntervalMessage(order.id);
  }

  caseTypeLabel(value) {
    switch (value) {
      case 'red':
        return 'Red Only';
      case 'white':
        return 'White Only';
      case 'mixed':
        return `Mixed (${this.state.selectedSize * (2 / 3)} Red & ${this.state.selectedSize * (1 / 3)} White)`;
      default:
        return 'default';
    }
  }

  render() {
    const { order } = this.props;

    return (
      <div>
        {this.state.editing ?
          <form
            onSubmit={this.saveCasePreferences}
            ref={(el) => {
              this.formElement = el;
            }}
          >
            <div className="subscription-field">
              <label htmlFor="size">Shipment Size:</label>
              <Select
                name="size"
                defaultValue={`${this.state.selectedSize}`}
                options={[{ name: '6 bottles', value: 6 }, { name: '12 bottles', value: 12 }]}
                onChange={this.caseSizeChange}
              />
            </div>
            <div className="subscription-field">
              <label htmlFor="type">Wine Mix:</label>
              <Select
                name="type"
                defaultValue={`${this.state.selectedType}`}
                options={
                  [{ name: 'Red Only', value: 'red' }, { name: 'White Only', value: 'white' },
                    { name: `Mixed (${this.state.selectedSize * (2 / 3)} Red & ${this.state.selectedSize * (1 / 3)} White)`, value: 'mixed' }]}
                onChange={this.caseTypeChange}
              />
            </div>
            <ButtonGroup>
              <Button
                name="save_frequency_interval_changes"
                loading={this.state.updatingCasePreferences}
                type="submit"
                textKey="save_button_text"
                disabled={this.state.updateCasePreferencesButtonDisabled}
              />
              <Button
                textKey="cancel_button_text"
                onClick={this.disableEditing}
                btnStyle="secondary"
              />
            </ButtonGroup>
          </form>
          :
          <div>
            <span
              key="change_preferences_info"
              role="presentation"
            >
              Shipment Size: {this.state.selectedSize} bottles <br />
              Wine Mix: {this.caseTypeLabel(this.state.selectedType)}
            </span>
            <br />
            <span
              key="change_preferences"
              role="presentation"
              className="text-button"
              onClick={this.enableEditing}
            >
              Change preferences
            </span>
          </div>
        }
      </div>
    );
  }
}

CasePreferencesBlock.propTypes = {
  dismissFrequencyIntervalMessage: PropTypes.func.isRequired,
  frequencyIntervalMessage: MESSAGE_PROP_TYPE,
  order: ORDER_PROP_TYPE.isRequired,
  appInitializeData: PropTypes.func.isRequired,
  // group: PropTypes.shape({}).isRequired,
  // updateFrequencyInterval: PropTypes.func.isRequired,
};

CasePreferencesBlock.defaultProps = {
  frequencyIntervalMessage: null,
};

const mapStateToProps = (state, ownProps) => ({
  frequencyIntervalMessage: state.userInterface.frequencyIntervalMessage[ownProps.orderId],
  order: state.data.orders.find(order => order.id === ownProps.orderId),
});

const mapDispatchToProps = dispatch => ({
  dismissFrequencyIntervalMessage: (orderId) => {
    dispatch(actions.dismissFrequencyIntervalMessage(orderId));
  },
  appInitializeData: () => {
    dispatch(actions.appDataInitialize());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CasePreferencesBlock);
