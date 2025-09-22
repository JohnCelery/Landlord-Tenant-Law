import { useMemo } from 'react'

import { useActivePack } from '../data/packs'
import {
  MAP_MODIFIERS,
  campaignBuildings,
  hydrateBuildingView,
  resolveBuildingTopics,
  useCampaignState,
} from '../core/campaign'

const MapPage = () => {
  const pack = useActivePack()
  const {
    earnedBadges,
    selectedBuildingId,
    selectBuilding,
    grantBadge,
    activeModifiers,
    toggleModifier,
    isModifierActive,
  } = useCampaignState()

  const buildings = useMemo(
    () =>
      campaignBuildings.map((building) =>
        hydrateBuildingView(building, pack.badges ?? [], earnedBadges),
      ),
    [earnedBadges, pack.badges],
  )

  const selectedBuilding = useMemo(() => {
    return (
      buildings.find((building) => building.id === selectedBuildingId) ??
      buildings.find((building) => building.unlocked) ??
      buildings[0]
    )
  }, [buildings, selectedBuildingId])

  const totalBadges = pack.badges.length
  const badgeProgress = `${earnedBadges.length}/${totalBadges}`

  const selectedBuildingTopics = selectedBuilding
    ? resolveBuildingTopics(selectedBuilding, pack.topics)
    : pack.topics

  const activeModifierNames = useMemo(
    () =>
      activeModifiers.map((id) => MAP_MODIFIERS.find((modifier) => modifier.id === id)?.name ?? id),
    [activeModifiers],
  )

  const rewardBadgeId = selectedBuilding?.rewardBadgeId ?? null
  const rewardBadgeClaimed = rewardBadgeId ? earnedBadges.includes(rewardBadgeId) : false

  return (
    <section className="campaign-map">
      <header className="campaign-map__header">
        <div>
          <h2>Garden State Campaign Map</h2>
          <p className="small-print">
            Buildings unlock when their prerequisite badge is earned. Claim completions to expand
            the campus.
          </p>
        </div>
        <div className="map-progress">
          <span>Badge progress</span>
          <strong>{badgeProgress}</strong>
        </div>
      </header>

      <div className="map-grid">
        <div className="card map-card">
          <h3>New Jersey Field Office</h3>
          <div className="map-canvas" aria-label="New Jersey training map">
            {buildings.map((building) => {
              const isSelected = building.id === selectedBuilding?.id
              const className = [
                'map-building',
                building.unlocked ? 'map-building--unlocked' : 'map-building--locked',
                isSelected ? 'map-building--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={building.id}
                  type="button"
                  className={className}
                  style={{
                    left: `${building.position.x}%`,
                    top: `${building.position.y}%`,
                  }}
                  onClick={() => (building.unlocked ? selectBuilding(building.id) : undefined)}
                  aria-pressed={isSelected}
                  disabled={!building.unlocked}
                >
                  <span className="map-building__name">{building.name}</span>
                  <span className="map-building__status">
                    {building.unlocked ? 'Active' : 'Locked'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="card map-detail" aria-live="polite">
          {selectedBuilding ? (
            <>
              <header>
                <h3>{selectedBuilding.name} campus</h3>
                <p className="small-print">{selectedBuilding.lore}</p>
              </header>
              <p>{selectedBuilding.description}</p>
              <dl className="map-detail__meta">
                <div>
                  <dt>Focus topics</dt>
                  <dd>{selectedBuildingTopics.join(', ')}</dd>
                </div>
                {selectedBuilding.requiredBadge ? (
                  <div>
                    <dt>Requires</dt>
                    <dd>
                      {selectedBuilding.requiredBadge.name}
                      <span className="small-print">
                        {' '}
                        {selectedBuilding.requiredBadge.description}
                      </span>
                    </dd>
                  </div>
                ) : (
                  <div>
                    <dt>Requires</dt>
                    <dd>None — available from day one</dd>
                  </div>
                )}
                {selectedBuilding.rewardBadge ? (
                  <div>
                    <dt>Awards</dt>
                    <dd>
                      {selectedBuilding.rewardBadge.name}
                      <span className="small-print">
                        {' '}
                        {selectedBuilding.rewardBadge.description}
                      </span>
                    </dd>
                  </div>
                ) : null}
              </dl>
              {rewardBadgeId ? (
                <button
                  type="button"
                  onClick={() => grantBadge(rewardBadgeId)}
                  disabled={!selectedBuilding.unlocked || rewardBadgeClaimed}
                >
                  {rewardBadgeClaimed
                    ? 'Badge claimed'
                    : `Claim ${selectedBuilding.rewardBadge?.name ?? 'badge'}`}
                </button>
              ) : null}
            </>
          ) : (
            <p>Select an unlocked building to see its campaign briefing.</p>
          )}
        </aside>
      </div>

      <section className="card map-modifiers">
        <h3>Director modifiers</h3>
        <p className="small-print">
          Toggle the regional conditions that change scoring and the actions available to the
          scenario director.
        </p>
        <div className="map-modifier-list">
          {MAP_MODIFIERS.map((modifier) => {
            const active = isModifierActive(modifier.id)
            return (
              <article key={modifier.id} className="map-modifier-card">
                <button
                  type="button"
                  className={`map-modifier-chip${active ? ' map-modifier-chip--active' : ''}`}
                  onClick={() => toggleModifier(modifier.id)}
                  aria-pressed={active}
                >
                  {modifier.name}
                </button>
                <p>{modifier.description}</p>
                <p className="small-print">{modifier.effectSummary}</p>
              </article>
            )
          })}
        </div>
        {activeModifiers.length > 0 ? (
          <p className="small-print">Active modifiers: {activeModifierNames.join(', ')}</p>
        ) : (
          <p className="small-print">No map modifiers are active.</p>
        )}
      </section>
    </section>
  )
}

export default MapPage
