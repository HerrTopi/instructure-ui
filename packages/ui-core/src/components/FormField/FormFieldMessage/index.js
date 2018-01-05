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
import classnames from 'classnames'
import themeable from '@instructure/ui-themeable'

import ScreenReaderContent from '../../ScreenReaderContent'

import styles from './styles.css'
import theme from './theme'

/**
---
parent: FormField
---

This is a helper component that is used by most of the custom form
components. In most cases it shouldn't be used directly.

```js
---
example: true
---
<FormFieldMessage variant="error">Invalid value</FormFieldMessage>
```
**/
@themeable(theme, styles)
export default class FormFieldMessage extends Component {
  static propTypes = {
    variant: PropTypes.oneOf(['error', 'hint', 'success', 'screenreader-only']),
    children: PropTypes.node
  }

  static defaultProps = {
    variant: 'hint'
  }

  render () {
    const classes = {
      [styles.root]: true,
      [styles[this.props.variant]]: true
    }
    return (
      (this.props.variant !== 'screenreader-only')
        ? <span className={classnames(classes)}>{this.props.children}</span>
        : <ScreenReaderContent>{this.props.children}</ScreenReaderContent>
    )
  }
}
