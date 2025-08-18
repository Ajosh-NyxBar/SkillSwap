import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUserSkills, createSkill, deleteSkill } from '../features/skillSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { useToast } from '../components/ui/toaster'
import { Plus, Trash2, Edit, BookOpen, Target } from 'lucide-react'

const Skills = () => {
  const dispatch = useDispatch()
  const { userSkills, loading } = useSelector((state) => state.skills)
  const { toast } = useToast()
  
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    skill_type: 'offering',
    tags: ''
  })

  useEffect(() => {
    dispatch(fetchUserSkills())
  }, [dispatch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.category) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in required fields",
      })
      return
    }

    try {
      await dispatch(createSkill(formData)).unwrap()
      toast({
        title: "Success",
        description: "Skill added successfully!",
      })
      setFormData({
        title: '',
        description: '',
        category: '',
        level: 'beginner',
        skill_type: 'offering',
        tags: ''
      })
      setShowForm(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || error || "Failed to add skill",
      })
    }
  }

  const handleDelete = async (skillId) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      try {
        await dispatch(deleteSkill(skillId)).unwrap()
        toast({
          title: "Success",
          description: "Skill deleted successfully!",
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message || error || "Failed to delete skill",
        })
      }
    }
  }

  const offeringSkills = userSkills.filter(skill => skill.skill_type === 'offering')
  const seekingSkills = userSkills.filter(skill => skill.skill_type === 'seeking')

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Skills</h1>
          <p className="text-muted-foreground">Manage the skills you offer and seek</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {/* Add Skill Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Skill</CardTitle>
            <CardDescription>Share your expertise or add a skill you want to learn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Guitar Lessons, Web Development"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., Music, Programming, Design"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="skill_type">Type</Label>
                  <select
                    id="skill_type"
                    value={formData.skill_type}
                    onChange={(e) => setFormData({...formData, skill_type: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="offering">I can teach this</option>
                    <option value="seeking">I want to learn this</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your skill level, experience, or what you're looking for..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  placeholder="e.g., beginner-friendly, weekend, online"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  Add Skill
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Skills Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Offering Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Skills You Offer ({offeringSkills.length})
            </CardTitle>
            <CardDescription>
              Skills you can teach or mentor others in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {offeringSkills.length > 0 ? (
              <div className="space-y-4">
                {offeringSkills.map((skill) => (
                  <div key={skill.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{skill.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {skill.category} • {skill.level}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(skill.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {skill.description && (
                      <p className="text-sm mb-2">{skill.description}</p>
                    )}
                    {skill.tags && (
                      <div className="flex flex-wrap gap-1">
                        {skill.tags.split(',').map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No skills offered yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seeking Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Skills You're Seeking ({seekingSkills.length})
            </CardTitle>
            <CardDescription>
              Skills you want to learn or improve
            </CardDescription>
          </CardHeader>
          <CardContent>
            {seekingSkills.length > 0 ? (
              <div className="space-y-4">
                {seekingSkills.map((skill) => (
                  <div key={skill.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{skill.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {skill.category} • {skill.level}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(skill.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {skill.description && (
                      <p className="text-sm mb-2">{skill.description}</p>
                    )}
                    {skill.tags && (
                      <div className="flex flex-wrap gap-1">
                        {skill.tags.split(',').map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No skills being sought yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Skills
