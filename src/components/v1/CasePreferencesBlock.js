import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import SelectField from './SelectField';
import Select from './Select';
import Button from './Button';
import Message from './Message';
import * as actions from '../../actions';
import ButtonGroup from './ButtonGroup';
import { MESSAGE_PROP_TYPE, ORDER_PROP_TYPE } from '../../constants/PropTypes';

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
    fetch(`https://testingroom18.myshopify.com/admin/api/2019-10/customers/${shopifyCustomerId}/metafields.json`,{
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
    console.log(formInformation)
    e.preventDefault();

    fetch(`https://testingroom18.myshopify.com/admin/api/2020-01/metafields/${this.state.sizeMetafieldID}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': 'b3a13411c43e3f26aa89b5db24996c55',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metafield: {
          id: this.state.sizeMetafieldID,
          value: formInformation.size,
          value_type: 'integer',
        },
      }),
    }).then(res => res.json())
      .then(
        (result) => {
          const selectedSize = result.metafield.value;
          const sizeMetafieldID = result.metafield.id;
          this.setState({
            selectedSize,
            sizeMetafieldID,
          });
        },
      );

    fetch(`https://testingroom18.myshopify.com/admin/api/2020-01/metafields/${this.state.typeMetafieldID}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': 'b3a13411c43e3f26aa89b5db24996c55',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metafield: {
          id: this.state.typeMetafieldID,
          value: formInformation.type,
          value_type: 'string',
        },
      }),
    }).then(res => res.json())
      .then(
        (result) => {
          const selectedType = result.metafield.value;
          const typeMetafieldID = result.metafield.id;
          this.setState({
            selectedType,
            typeMetafieldID,
          });
        },
      );

    this.disableEditing();
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
                options={[{ name: "6 bottles", value: 6 }, { name: "12 bottles", value: 12 }]}
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
            {this.props.frequencyIntervalMessage ?
              <Message
                key="shipping-address-message"
                title={this.props.frequencyIntervalMessage.message}
                titleTextKey={this.props.frequencyIntervalMessage.messageTextKey}
                type={this.props.frequencyIntervalMessage.type}
                dismissable
                onDismissClick={this.dismissMessage}
              />
              :
              null
            }
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
});

export default connect(mapStateToProps, mapDispatchToProps)(CasePreferencesBlock);
