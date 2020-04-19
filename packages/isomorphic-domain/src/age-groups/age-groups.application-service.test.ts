import { AgeGroupsApplicationService } from './age-groups.application-service'
import { AgeGroups } from './age-groups'
import { AddAgeGroupCommand } from './add-age-group.command'
import { AgeGroup } from './age-group'
import { ChangeSwitchOverOnCommand } from './change-switch-over-on.command'
import { RemoveAgeGroupCommand } from './remove-age-group.command'

describe('AgeGroupsApplicationService', () => {
  const exampleGroups = AgeGroups.create('new-school-year')
    .withAddedAgeGroup(AgeGroup.create('Kleuters', new Set([2, 3, 4])))
    .withAddedAgeGroup(AgeGroup.create('Mini', new Set([5, 6, 7, 8])))
    .withAddedAgeGroup(AgeGroup.create('Maxi', new Set([9, 10])))
    .withAddedAgeGroup(AgeGroup.create('Tieners', new Set([11, 12, 13])))

  describe('addAgeGroup', () => {
    it('rejects if age group with name already exists', async () => {
      const repo = {
        findForTenant: jest.fn(() => Promise.resolve(exampleGroups)),
        putForTenant: jest.fn(() => Promise.resolve()),
      }
      const service = new AgeGroupsApplicationService(repo)

      const command = AddAgeGroupCommand.create(
        'my-tenant',
        AgeGroup.create('Tieners', new Set([12]))
      )

      const commandResult = await service.addAgeGroup(command)

      expect(commandResult).toEqual({ status: 'rejected' })
      expect(repo.putForTenant).not.toHaveBeenCalled()
    })

    it('accepts if age group can be added', async () => {
      const repo = {
        findForTenant: jest.fn(() => Promise.resolve(exampleGroups)),
        putForTenant: jest.fn(() => Promise.resolve()),
      }
      const service = new AgeGroupsApplicationService(repo)

      const command = AddAgeGroupCommand.create(
        'my-tenant',
        AgeGroup.create('Oudere tieners', new Set([14]))
      )

      const commandResult = await service.addAgeGroup(command)

      expect(commandResult).toEqual({ status: 'accepted' })
      expect(repo.putForTenant).toHaveBeenCalledTimes(1)
      expect(repo.putForTenant.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('changeSwitchOverOn', () => {
    it('changes switchover of age groups', async () => {
      const repo = {
        findForTenant: jest.fn(() => Promise.resolve(exampleGroups)),
        putForTenant: jest.fn(() => Promise.resolve()),
      }
      const service = new AgeGroupsApplicationService(repo)

      const command = ChangeSwitchOverOnCommand.create(
        'some-tenant',
        'childs-birthday'
      )

      const commandResult = await service.changeSwitchOverOn(command)

      expect(commandResult).toEqual({ status: 'accepted' })
      expect(repo.putForTenant).toHaveBeenCalledTimes(1)
      expect(repo.putForTenant.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('removeAgeGroup', () => {
    it('removes an age group by name', async () => {
      const repo = {
        findForTenant: jest.fn(() => Promise.resolve(exampleGroups)),
        putForTenant: jest.fn(() => Promise.resolve()),
      }
      const service = new AgeGroupsApplicationService(repo)

      const command = RemoveAgeGroupCommand.create('some-tenant', 'Tieners')

      const commandResult = await service.removeAgeGroup(command)

      expect(commandResult).toEqual({ status: 'accepted' })
      expect(repo.putForTenant).toHaveBeenCalledTimes(1)
      expect(repo.putForTenant.mock.calls[0]).toMatchSnapshot()
    })
  })

  describe('findAgeGroups', () => {
    it('find age groups for a tenant', async () => {
      const repo = {
        findForTenant: jest.fn(() => Promise.resolve(exampleGroups)),
        putForTenant: jest.fn(() => Promise.resolve()),
      }
      const service = new AgeGroupsApplicationService(repo)

      const group = await service.findAgeGroups('my-tenant-name')

      expect(group).toEqual(exampleGroups)
      expect(repo.findForTenant).toHaveBeenCalledTimes(1)
      expect(repo.findForTenant.mock.calls[0]).toEqual(['my-tenant-name'])
    })
  })
})
