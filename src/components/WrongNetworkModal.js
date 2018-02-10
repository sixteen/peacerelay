import React, { Component } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'

class WrongNetworkModal extends Component {
    constructor(props) {
      super(props)
      this.state = {
        modal: true
      }
      
      this.toggle = this.toggle.bind(this)
    }

    toggle() {
        this.setState({
            modal: !this.state.modal
        });
    }

    render() {
        return (
        <div>
        <Button color="danger" onClick={this.toggle}>Wrong Network Detected</Button>
        <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
        <ModalHeader toggle={this.toggle}>Error</ModalHeader>
        <ModalBody>
        Kindly use either the Ropsten or Kovan networks.
        </ModalBody>
        <ModalFooter>
        <Button color="primary" onClick={this.toggle}>Close</Button>
        </ModalFooter>
        </Modal>
        </div>
        )
    }
}
    
    

export default WrongNetworkModal