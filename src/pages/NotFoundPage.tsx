import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <section>
      <h2>Page not found</h2>
      <p>The route you requested does not exist in this training build.</p>
      <Link to="/map" className="button-link">
        Return to campaign map
      </Link>
    </section>
  )
}

export default NotFoundPage
