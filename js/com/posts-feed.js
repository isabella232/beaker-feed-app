import {LitElement, html} from '/vendor/beaker-app-stdlib/vendor/lit-element/lit-element.js'
import {repeat} from '/vendor/beaker-app-stdlib/vendor/lit-element/lit-html/directives/repeat.js'
import {feed, followgraph} from '../tmp-unwalled-garden.js'
import postsFeedCSS from '../../css/com/posts-feed.css.js'
import '/vendor/beaker-app-stdlib/js/com/feed/composer.js'
import '/vendor/beaker-app-stdlib/js/com/feed/post.js'

const LOAD_LIMIT = 50

class PostsFeed extends LitElement {
  static get properties () {
    return {
      userUrl: {type: String, attribute: 'user-url'},
      followedUsers: {type: Array},
      posts: {type: Array}
    }
  }

  constructor () {
    super()

    this.userUrl = ''
    this.followedUsers = []
    this.posts = []
  }

  get feedAuthors () {
    return [this.userUrl].concat(this.followedUsers)
  }

  attributeChangedCallback (name, oldval, newval) {
    super.attributeChangedCallback(name, oldval, newval)
    if (name === 'user-url' && newval) {
      // trigger a load when we have a user url
      this.load()
    }
  }

  async load () {
    this.followedUsers = (await followgraph.listFollows(this.userUrl)).map(site => site.url)
    this.posts = await feed.query({
      filters: {authors: this.feedAuthors},
      limit: LOAD_LIMIT,
      reverse: true
    })
    console.log(this.posts)
  }

  // rendering
  // =

  render () {
    return html`
      <beaker-feed-composer @submit=${this.onSubmitFeedComposer}></beaker-feed-composer>
      ${repeat(this.posts, post => html`<beaker-feed-post .post=${post}></beaker-feed-post>`)}
    `
  }

  // events
  // =

  async onSubmitFeedComposer (e) {
    // add the new post
    try {
      await feed.addPost({content: {body: e.detail.body}})
    } catch (e) {
      alert('Something went wrong. Please let the Beaker team know! (An error is logged in the console.)')
      console.error('Failed to add post')
      console.error(e)
      return
    }

    // reload the feed to show the new post
    this.load()
  }
}
PostsFeed.styles = postsFeedCSS
customElements.define('posts-feed', PostsFeed)