import React, { Component } from 'react'
import { FormGroup, Label, Input } from 'reactstrap'
class AccountInfo extends Component {
    constructor(props) {
      super(props)
    }
  
    render() {
      return (
        <div className="AccountInfo">
          <FormGroup>
            <Label>Your account address</Label>
            <Input type='text' disabled value={this.props.currAccount}/>
          </FormGroup>
        </div>
      );
    }
  }
  
  export default AccountInfo