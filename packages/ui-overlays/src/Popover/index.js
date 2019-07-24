/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - present Instructure, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import keycode from 'keycode'

import {
  ContextView,
  Position,
  LayoutPropTypes,
  parsePlacement,
  mirrorHorizontalPlacement
} from '@instructure/ui-layout'
import { View } from '@instructure/ui-view'
import { Dialog } from '@instructure/ui-a11y'
import { bidirectional } from '@instructure/ui-i18n'
import { Children, controllable, element } from '@instructure/ui-prop-types'
import {
  findDOMNode,
  containsActiveElement,
  requestAnimationFrame,
  handleMouseOverOut
} from '@instructure/ui-dom-utils'
import { ComponentIdentifier, safeCloneElement, pickProps } from '@instructure/ui-react-utils'
import { createChainedFunction, shallowEqual, px } from '@instructure/ui-utils'
import { error } from '@instructure/console/macro'
import { uid } from '@instructure/uid'
import { ThemeablePropTypes } from '@instructure/ui-themeable'
import { testable } from '@instructure/ui-testable'

@testable()
class PopoverTrigger extends ComponentIdentifier {
  static displayName = 'PopoverTrigger'
}

@testable()
class PopoverContent extends ComponentIdentifier {
  static displayName = 'PopoverContent'
}

/**
---
category: components
---
**/
@testable()
@bidirectional()
class Popover extends Component {
  static Trigger = PopoverTrigger
  static Content = PopoverContent

  static propTypes = {
    /**
     * Children of the `<Popover />`
     */
    children: Children.oneOf([PopoverTrigger, PopoverContent]),

    /**
     * The placement of the content in relation to the trigger
     */
    placement: LayoutPropTypes.placement,

    /**
     * The action that causes the Content to display (`click`, `hover`, `focus`)
     */
    on: PropTypes.oneOfType([
      PropTypes.oneOf(['click', 'hover', 'focus']),
      PropTypes.arrayOf(PropTypes.oneOf(['click', 'hover', 'focus']))
    ]),

    variant: PropTypes.oneOf(['default', 'inverse']),

    /**
    * Controls the shadow depth for the `<Popover />`
    */
    shadow: ThemeablePropTypes.shadow,

    /**
    * Controls the z-index depth for the `<Popover />` content
    */
    stacking: ThemeablePropTypes.stacking,

    /**
     * Whether or not the content should be rendered on initial render.
     */
    defaultShow: PropTypes.bool,

    /**
    * Whether or not the `<Popover />` is shown (should be accompanied by `onToggle`)
    */
    show: controllable(PropTypes.bool, 'onToggle', 'defaultShow'),

    /**
     *
     * A function that returns a reference to the content element
     */
    contentRef: PropTypes.func,

    /**
     * Call this function when the content visibility is toggled. When used with `show`,
     * `<Popover />` will not control its own state.
     */
    onToggle: PropTypes.func,

    /**
     * Callback fired when component is clicked
     */
    onClick: PropTypes.func,

    /**
     * Callback fired when trigger is focused
     */
    onFocus: PropTypes.func,

    /**
     * Callback fired when component is blurred
     */
    onBlur: PropTypes.func,

    onKeyDown: PropTypes.func,

    /**
     * Callback fired when content is rendered and positioned
     */
    onShow: PropTypes.func,

    /**
     * Callback fired when mouse is over trigger
     */
    onMouseOver: PropTypes.func,

    /**
     * Callback fired when mouse leaves trigger
     */
    onMouseOut: PropTypes.func,

    /**
     * Callback fired when the `<Popover />` requests to be hidden (via close button, escape key, etc.)
     */
    onDismiss: PropTypes.func,

    /**
    * Should the `<Popover />` display with an arrow pointing to the trigger
    */
    withArrow: PropTypes.bool,

    /**
     * An accessible label for the `<Popover />` content
     */
    label: PropTypes.string,

    /**
     * An element or a function returning an element to focus by default
     */
    defaultFocusElement: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),

    /**
    * Should the `<Popover />` render offscreen when visually hidden
    */
    shouldRenderOffscreen: PropTypes.bool,

    /**
     * Whether focus should contained within the `<Popover/>` when it is open
     */
    shouldContainFocus: PropTypes.bool,

    /**
     * Whether focus should be returned to the trigger when the `<Popover/>` is closed
     */
    shouldReturnFocus: PropTypes.bool,

    /**
     * Should the `<Popover />` hide when clicks occur outside the content
     */
    shouldCloseOnDocumentClick: PropTypes.bool,

    /**
     * Should the `<Popover />` hide when the escape key is pressed
     */
    shouldCloseOnEscape: PropTypes.bool,

    /**
     * The horizontal offset for the positioned content
     */
    offsetX: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    /**
     * The vertical offset for the positioned content
     */
    offsetY: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    /**
     * Callback fired when the position changes
     */
    onPositionChanged: PropTypes.func,

    /**
     * Callback fired when content has been mounted and is initially positioned
     */
    onPositioned: PropTypes.func,

    /**
     * Whether or not position should be tracked or just set on initial render
     */
    trackPosition: PropTypes.bool,

    /**
     * The parent in which to constrain the popover.
     * One of: 'window', 'scroll-parent', 'parent', 'none', an element,
     * or a function returning an element
     */
    constrain: LayoutPropTypes.constrain,

    /**
     * An element or a function returning an element to use as the mount node
     * for the `<Popover />` (defaults to `document.body`)
     */
    mountNode: LayoutPropTypes.mountNode,

    /**
     * Insert the element at the 'top' of the mountNode or at the 'bottom'
     */
    insertAt: PropTypes.oneOf(['bottom', 'top']),

    /**
     * An element, function returning an element, or array of elements that will not be hidden from
     * the screen reader when the `<Popover />` is open
     */
    liveRegion: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.element), PropTypes.element, PropTypes.func]),

    /**
     * Target element for positioning the Popover (if it differs from the trigger)
     */
    positionTarget: PropTypes.oneOfType([element, PropTypes.func]),

    /**
     * should the content offset to align by its arrow
     */
    alignArrow: PropTypes.bool,
    id: PropTypes.string,

    /**
     * should the content become focused when the trigger is blurred
     */
    shouldFocusContentOnTriggerBlur: PropTypes.bool
  }

  static defaultProps = {
    children: null,
    onToggle: open => {},
    onClick: event => {},
    onFocus: event => {},
    onBlur: event => {},
    onMouseOver: event => {},
    onMouseOut: event => {},
    onShow: position => {},
    onDismiss: (event, documentClick) => {},
    placement: 'bottom center',
    stacking: 'topmost',
    shadow: 'resting',
    offsetX: 0,
    offsetY: 0,
    variant: 'default',
    on: ['hover', 'focus'],
    contentRef: el => {},
    defaultShow: false,
    withArrow: true,
    trackPosition: true,
    constrain: 'window',
    onPositioned: position => {},
    onPositionChanged: position => {},
    shouldRenderOffscreen: false,
    shouldContainFocus: false,
    shouldReturnFocus: true,
    shouldCloseOnDocumentClick: true,
    shouldFocusContentOnTriggerBlur: false,
    shouldCloseOnEscape: true,
    defaultFocusElement: null,
    label: null,
    mountNode: null,
    insertAt: 'bottom',
    liveRegion: null,
    positionTarget: null,
    alignArrow: false,
    id: undefined,
    show: undefined,
    closeButtonRef: undefined,
    closeButtonLabel: undefined,
    onKeyDown: undefined
  }

  constructor (props) {
    super(props)

    this.state = {
      placement: props.placement,
      offsetX: props.offsetX,
      offsetY: props.offsetY
    }

    if (typeof props.show === 'undefined') {
      this.state.show = props.defaultShow
    }

    this._id = this.props.id || uid('Popover')

    this._raf = []
  }

  componentWillMount () {
    this._handleMouseOver = handleMouseOverOut.bind(null, () => {
      this.show()
    })
    this._handleMouseOut = handleMouseOverOut.bind(null, () => {
      this.hide()
    })
  }

  componentWillUnmount () {
    this._raf.forEach(request => request.cancel())
    this._raf = []
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !(shallowEqual(this.props, nextProps) && shallowEqual(this.state, nextState))
  }

  get placement () {
    let { placement } = this.props

    if (this.rtl) {
      placement = mirrorHorizontalPlacement(placement, ' ')
    }

    return !this.shown && this.props.shouldRenderOffscreen ? 'offscreen' : placement
  }

  get shown () {
    return (typeof this.props.show === 'undefined') ? this.state.show : this.props.show
  }

  show = () => {
    if (typeof this.props.show === 'undefined') {
      this.setState({ show: true })
    }

    if (typeof this.props.onToggle === 'function') {
      this.props.onToggle(true)
    }
  }

  hide = (e, documentClick) => {
    const {
      onDismiss,
      onToggle,
      show
    } = this.props

    if (typeof show === 'undefined') {
      this.setState(({ show }) => {
        if (show) {
          onDismiss(e, documentClick)
        }
        return { show: false }
      })
    } else if (show) {
      onDismiss(e, documentClick)
    }

    onToggle(false)
  }

  toggle = () => {
    if (this.shown) {
      this.hide()
    } else {
      this.show()
    }
  }

  handleDialogDismiss = (...args) => {
    if (!this.props.shouldReturnFocus && this.props.shouldFocusContentOnTriggerBlur) {
      const trigger = findDOMNode(this._trigger)

      if (trigger && typeof trigger.focus === 'function') {
        trigger.focus()
      }
    }
    this.hide(...args)
  }

  handleDialogBlur = (event) => {
    if (event.keyCode === keycode.codes.tab && event.shiftKey && this.props.shouldFocusContentOnTriggerBlur) {
      return
    }
    this.hide(event)
  }

  handleTriggerKeyDown = (event) => {
    if (!this.props.shouldFocusContentOnTriggerBlur) {
      return
    }

    if (event.keyCode === keycode.codes.tab && !event.shiftKey) {
      event.preventDefault()
      this._raf.push(requestAnimationFrame(() => {
        this._dialog && this._dialog.focus()
      }))
    }
  }

  handleTriggerBlur = (event) => {
    if (this.props.on.indexOf('focus') > -1) {
      this._raf.push(requestAnimationFrame(() => {
        if (!containsActiveElement(this._view)) {
          this.hide()
        }
      }))
    }
  }

  handlePositionChanged = ({ placement }) => {
    this.setState({
      placement,
      ...this.computeOffsets(placement)
    })
  }

  renderTrigger () {
    let trigger = ComponentIdentifier.pick(Popover.Trigger, this.props.children)

    if (trigger) {
      const { on, shouldContainFocus } = this.props
      let onClick
      let onFocus
      let onMouseOut
      let onMouseOver
      let expanded

      if (on.indexOf('click') > -1) {
        onClick = () => {
          this.toggle()
        }
      }

      if (on.indexOf('hover') > -1) {
        error(
          !(on === 'hover'),
          '[Popover] Specifying only the `"hover"` trigger limits the visibilty of the Popover to just mouse users. ' +
          'Consider also including the `"focus"` trigger ' +
          'so that touch and keyboard only users can see the Popover content as well.'
        )

        onMouseOver = this._handleMouseOver
        onMouseOut = this._handleMouseOut
      }

      if (on.indexOf('focus') > -1) {
        onFocus = () => {
          this.show()
        }
      }

      if (shouldContainFocus) {
        // only set aria-expanded if popover can contain focus
        expanded = this.shown ? 'true' : 'false'
      } else {
        expanded = null
      }

      trigger = safeCloneElement(trigger, {
        ref: el => {
          this._trigger = el
        },
        'aria-expanded': expanded,
        onKeyDown: createChainedFunction(this.handleTriggerKeyDown, this.props.onKeyDown),
        onClick: createChainedFunction(onClick, this.props.onClick),
        onBlur: createChainedFunction(this.handleTriggerBlur, this.props.onBlur),
        onFocus: createChainedFunction(onFocus, this.props.onFocus),
        onMouseOut: createChainedFunction(onMouseOut, this.props.onMouseOut),
        onMouseOver: createChainedFunction(onMouseOver, this.props.onMouseOver)
      })
    }

    return trigger
  }

  get defaultFocusElement () {
    return this.props.defaultFocusElement
  }

  renderContent () {
    let content = ComponentIdentifier.pick(Popover.Content, this.props.children)

    if (this.shown) {
      content = (
        <Dialog
          {...pickProps(this.props, Dialog.propTypes)}
          ref={(el) => this._dialog = el}
          display="block"
          open={this.shown}
          onBlur={this.handleDialogBlur}
          onDismiss={this.handleDialogDismiss}
          defaultFocusElement={this.defaultFocusElement}
          shouldFocusOnOpen={!this.props.shouldFocusContentOnTriggerBlur}
        >
          {content}
        </Dialog>
      )
    }

    if (this.shown || this.props.shouldRenderOffscreen) {
      let ViewElement
      let viewProps = {
        ref: c => this._view = c,
        elementRef: this.props.contentRef,
        stacking: this.props.stacking,
        shadow: this.props.shadow,
        display: 'block'
      }

      const { placement } = this.state

      if (this.props.withArrow) {
        ViewElement = ContextView
        viewProps = {
          ...viewProps,
          background: this.props.variant,
          placement: this.rtl ? mirrorHorizontalPlacement(placement, ' ') : placement
        }
      } else {
        ViewElement = View
        viewProps = {
          ...viewProps,
          background: this.props.variant === 'default' ? 'primary' : 'primary-inverse',
          borderWidth: 'small',
          borderRadius: 'medium'
        }
      }

      return (
        <ViewElement {...viewProps}>
          {content}
        </ViewElement>
      )
    } else {
      return null
    }
  }

  computeOffsets (placement) {
    let { offsetX, offsetY } = this.props

    if (this.props.alignArrow && this._view) {
      const secondaryPlacement = parsePlacement(placement)[1]
      const { arrowSize, arrowBorderWidth } = this._view.theme
      const offsetAmount = (px(arrowSize) + px(arrowBorderWidth)) * 2
      if (secondaryPlacement === 'start') {
        offsetX = offsetAmount
      } else if (secondaryPlacement === 'end') {
        offsetX = -offsetAmount
      } else if (secondaryPlacement === 'top') {
        offsetY = offsetAmount
      } else if (secondaryPlacement === 'bottom') {
        offsetY = -offsetAmount
      }
    }

    return {
      offsetX,
      offsetY
    }
  }

  get positionProps () {
    return {
      ...pickProps(this.props, Position.propTypes),
      offsetX: this.state.offsetX,
      offsetY: this.state.offsetY,
      trackPosition: this.shown,
      placement: this.placement,
      onPositioned: createChainedFunction(this.handlePositionChanged, this.props.onShow),
      onPositionChanged: this.handlePositionChanged,
      target: this.props.positionTarget,
      id: this._id
    }
  }

  render () {
    const positionProps = this.positionProps

    if (this.props.positionTarget) {
      return (
        <span>
          {this.renderTrigger()}
          <Position {...positionProps}>
            <Position.Content>
              {this.renderContent()}
            </Position.Content>
          </Position>
        </span>
      )
    } else {
      return (
        <Position {...positionProps}>
          <Position.Target>
            {this.renderTrigger()}
          </Position.Target>
          <Position.Content>
            {this.renderContent()}
          </Position.Content>
        </Position>
      )
    }
  }
}

export default Popover
export { Popover, PopoverTrigger, PopoverContent }