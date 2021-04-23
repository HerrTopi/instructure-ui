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

import { storiesOf } from '@storybook/react'
import { renderExample } from './renderExample.js'
import { renderPage } from './renderPage.js'
import generateComponentExamples from './generateComponentExamples.js'
import React from 'react'
// must be imported with Webpack because this file cannot contain async calls
import propJSONData from './prop-data.json'

const examplesContext = require.context(
  '../',
  true,
  /^.*\/src\/.*\.examples\.js$/,
  'sync'
)

const componentsContext = require.context(
  '../',
  true,
  /^.*\/src\/.*\/index\.js$/,
  'sync'
)

const everyExample = {}
examplesContext.keys().map((requirePath) => {
  const exampleDir = requirePath.split("/").slice(0,-2).join('/')
  const exampleModule = componentsContext(exampleDir + '/index.js')
  const componentName = exampleModule.default.displayName || exampleModule.default.name
  everyExample[componentName] = exampleModule
})

let numStories = 0
// eslint-disable-next-line no-console
console.log(`Creating stories for ${examplesContext.keys().length} components..`)

examplesContext.keys().map((requirePath) => {
  // ctx holds an xyz.examples.js file, was {componentName, sections}
  const ctx = examplesContext(requirePath)
  const config = ctx.default
  const pathParts = requirePath.split("/")
  const componentName = pathParts[pathParts.length - 3]
  const Component = everyExample[componentName].default
  const generatedPropValues = propJSONData[componentName]
  // merge in generated prop values:
  config.propValues = Object.assign(generatedPropValues,config.propValues || {})
  config.maxExamples = config.maxExamples ? config.maxExamples : 500

  const sections = generateComponentExamples(Component, config)

  if (sections && sections.length > 0) {
    const stories = storiesOf(componentName, module)
    sections.forEach(({ pages, sectionName }) => {
      pages.forEach((page, i) => {
        // eslint-disable-next-line no-param-reassign
        page.renderExample = renderExample
        numStories++
        stories.add(
          `${sectionName}${pages.length > 1 ? ` (page ${i + 1})` : ''}`,
          renderPage.bind(null, page),
          {
            chromatic: {
              viewports: [1200],
              pauseAnimationAtEnd: true,
              delay: 700,
              ...page.parameters
            }
          }
        )
      })
    })
  }
})
// eslint-disable-next-line no-console
console.log(`Created ${numStories} stories!`)
