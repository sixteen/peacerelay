import React, { Component } from 'react'
import MDSpinner from 'react-md-spinner'
import { convertToken } from '../utils/lockBurn.js';

class LockTxStatus extends Component {
    constructor(props) {
      super(props)
    }
  
    render() {
      return (
        <MDSpinner size={100} />
      );
    }
  }
  
  export default LockTxStatus